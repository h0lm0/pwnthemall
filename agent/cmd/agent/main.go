package main

import (
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/coreos/go-iptables/iptables"
)

type FirewallRequest struct {
	TeamID     uint     `json:"team_id"`
	Subnet     string   `json:"subnet"`      // ex: "172.21.3.0/24"
	AllowedIPs []string `json:"allowed_ips"` // ex: ["1.2.3.4", "9.8.7.6"]
}

func main() {
	http.HandleFunc("/team/firewall", teamFirewallHandler)
	go func() {
		log.Println("[agent] Listening on :8383 (team firewall agent)")
		if err := http.ListenAndServe(":8383", nil); err != nil {
			log.Fatalf("FIREWALL AGENT FATAL: %v", err)
		}
	}()
	waitForSig()
}

func teamFirewallHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "only POST allowed", http.StatusMethodNotAllowed)
		return
	}
	var req FirewallRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad JSON", 400)
		return
	}
	log.Printf("Firewall update: team %d / subnet %s / %d IPs", req.TeamID, req.Subnet, len(req.AllowedIPs))
	if err := ApplyTeamFirewall(req.TeamID, req.Subnet, req.AllowedIPs); err != nil {
		log.Printf("Firewall ERROR: %v", err)
		http.Error(w, err.Error(), 500)
		return
	}
	w.WriteHeader(200)
	w.Write([]byte("ok\n"))
}

func ApplyTeamFirewall(teamID uint, subnet string, allowedIPs []string) error {
	ipt, err := iptables.New()
	if err != nil {
		return err
	}
	chain := "DOCKER-USER"
	rules, err := ipt.List("filter", chain)
	if err != nil {
		return err
	}
	subnetCIDR := canonicalCIDR(subnet)
	for _, rule := range rules {
		if rule == "" {
			continue
		}
		if strings.Contains(rule, "-d "+subnetCIDR) {
			fields := parseIptRule(rule)
			if len(fields) >= 2 {
				_ = ipt.Delete("filter", chain, fields[2:]...)
			}
		}
	}
	for _, ip := range allowedIPs {
		rule := []string{"-s", ip, "-d", subnetCIDR, "-j", "ACCEPT"}
		_ = ipt.AppendUnique("filter", chain, rule...)
	}
	rule := []string{"-d", subnetCIDR, "-j", "DROP"}
	_ = ipt.AppendUnique("filter", chain, rule...)
	log.Printf("Firewall updated for team %d subnet %s", teamID, subnetCIDR)
	return nil
}

func canonicalCIDR(cidr string) string {
	_, ipnet, err := net.ParseCIDR(cidr)
	if err != nil {
		return cidr
	}
	return ipnet.String()
}

func parseIptRule(line string) []string {
	// ex: "-A DOCKER-USER -s 1.2.3.4/32 -d 172.21.3.0/24 -j ACCEPT"
	return strings.Fields(line)
}

func waitForSig() {
	c := make(chan os.Signal, 1)
	signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)
	<-c
	log.Println("[agent] Shutting down.")
	os.Exit(0)
}
