package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"strings"

	"github.com/coreos/go-iptables/iptables"
	"github.com/pwnthemall/pwnthemall/backend/config"
	"github.com/pwnthemall/pwnthemall/backend/debug"
	"github.com/pwnthemall/pwnthemall/backend/models"
	"github.com/pwnthemall/pwnthemall/backend/shared"
	"github.com/vishvananda/netlink"
)

func GetTeamSubnet(teamID int) (string, string, error) {
	baseCIDR := os.Getenv("PTA_CHALL_BASE_CIDR")
	_, ipnet, err := net.ParseCIDR(baseCIDR)
	if err != nil {
		return "", "", fmt.Errorf("invalid baseCIDR: %w", err)
	}

	baseIP := ipnet.IP.To4()
	if baseIP == nil {
		return "", "", fmt.Errorf("only IPv4 supported")
	}

	if ipnet.Mask[2] != 0 || ipnet.Mask[3] != 0 { // needs to be /16
		return "", "", fmt.Errorf("baseCIDR must be /16 subnet")
	}

	if teamID < 1 || teamID > 254 {
		return "", "", fmt.Errorf("teamID must be in 1..254")
	}

	subnetIP := net.IPv4(baseIP[0], baseIP[1], byte(teamID), 0)
	gatewayIP := net.IPv4(baseIP[0], baseIP[1], byte(teamID), 1)
	subnetStr := fmt.Sprintf("%s/24", subnetIP.String())
	gatewayStr := gatewayIP.String()
	return subnetStr, gatewayStr, nil
}

func GetTeamIPs(teamID uint) ([]string, error) {
	var users []models.User
	err := config.DB.Where("team_id = ?", teamID).Find(&users).Error
	if err != nil {
		return nil, fmt.Errorf("failed to fetch team members: %w", err)
	}
	var ips []string
	for _, user := range users {
		ips = append(ips, user.IPAddresses...)
	}
	return ips, nil
}

func GetTeamMappedPorts(teamID uint) ([]int, error) {
	var insts []models.Instance
	err := config.DB.Where("team_id = ?", teamID).Find(&insts).Error
	if err != nil {
		return nil, err
	}
	var ports []int
	for _, inst := range insts {
		for _, p := range inst.Ports {
			ports = append(ports, int(p))
		}
	}
	return ports, nil
}

func RefreshTeamNetworkFirewall(teamID uint, teamSubnet string, allowedIPs []string) error {
	ipt, err := iptables.New()
	if err != nil {
		return err
	}

	chain := "DOCKER-USER"
	rules, err := ipt.List("filter", chain)
	if err != nil {
		return fmt.Errorf("could not list iptables rules: %w", err)
	}
	for _, rule := range rules {
		if strings.Contains(rule, "-d "+teamSubnet) {
			_ = ipt.Delete("filter", chain, strings.Fields(rule)[2:]...)
		}
	}

	for _, ip := range allowedIPs {
		ruleSpec := []string{
			"-s", ip,
			"-d", teamSubnet,
			"-j", "ACCEPT",
		}
		_ = ipt.AppendUnique("filter", chain, ruleSpec...)
	}
	dropRule := []string{
		"-d", teamSubnet,
		"-j", "DROP",
	}
	_ = ipt.AppendUnique("filter", chain, dropRule...)
	return nil
}

func PushFirewallToAgent(teamID uint, ports []int, allowedIPs []string) error {
	if os.Getenv("PTA_DOCKER_INSTANCE_ISOLATION") == "true" {

		agentURL, err := getDefaultGateway()
		if err != nil {
			debug.Log("getDefaultGateway error: %v", err)
			return fmt.Errorf("firewall agent push failed")
		}
		body := shared.FirewallRequest{
			TeamID:     teamID,
			Ports:      ports,
			AllowedIPs: allowedIPs,
		}

		data, _ := json.Marshal(body)
		debug.Log("PushFirewallToAgent: agentURL %s", agentURL)
		resp, err := http.Post("http://"+agentURL+":8383/team/firewall", "application/json", bytes.NewReader(data))
		if err != nil {
			return fmt.Errorf("firewall agent push failed: %w", err)
		}
		defer resp.Body.Close()
		if resp.StatusCode != 200 {
			return fmt.Errorf("firewall agent returned %d", resp.StatusCode)
		}
	}
	return nil
}

func getDefaultGateway() (string, error) {
	routes, err := netlink.RouteList(nil, netlink.FAMILY_V4)
	if err != nil {
		return "", err
	}

	for _, r := range routes {
		if r.Dst == nil {
			continue
		}

		ones, bits := r.Dst.Mask.Size()
		if ones == 0 && bits == 32 {
			if r.Gw != nil {
				return r.Gw.String(), nil
			}
		}
	}

	return "", fmt.Errorf("default route not found")
}
