package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/coreos/go-iptables/iptables"
)

type FirewallRequest struct {
	TeamID     uint     `json:"team_id"`
	Ports      []int    `json:"ports"`
	AllowedIPs []string `json:"allowed_ips"`
}

func main() {
	http.HandleFunc("/team/firewall", teamFirewallHandler)
	go func() {
		log.Println("[pta-agent] Listening on :8383")
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
	log.Printf("Team %d: protect ports %v for IPs: %v", req.TeamID, req.Ports, req.AllowedIPs)
	if err := ApplyTeamFirewall(req.TeamID, req.Ports, req.AllowedIPs); err != nil {
		log.Printf("[AGENT] Firewall ERROR: %v", err)
		http.Error(w, err.Error(), 500)
		return
	}
	w.WriteHeader(200)
	w.Write([]byte("ok\n"))
}

func ApplyTeamFirewall(teamID uint, ports []int, allowedIPs []string) error {
	ipt, err := iptables.New()
	if err != nil {
		return err
	}
	chain := "INPUT"
	rules, err := ipt.List("filter", chain)
	if err != nil {
		return err
	}

	for _, rule := range rules {
		if rule == "" {
			continue
		}
		for _, port := range ports {
			if strings.Contains(rule, fmt.Sprintf("--dport %d", port)) {
				args := strings.Fields(rule)[2:]
				_ = ipt.Delete("filter", chain, args...)
			}
		}
	}
	for _, port := range ports {
		for _, ip := range allowedIPs {
			rule := []string{"-s", ip, "-p", "tcp", "--dport", fmt.Sprintf("%d", port), "-j", "ACCEPT"}
			_ = ipt.AppendUnique("filter", chain, rule...)
		}
		_ = ipt.AppendUnique("filter", chain, []string{"-p", "tcp", "--dport", fmt.Sprintf("%d", port), "-j", "DROP"}...)
	}
	log.Printf("Firewall rules applied for team %d on ports %v", teamID, ports)
	return nil
}

func waitForSig() {
	c := make(chan os.Signal, 1)
	signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)
	<-c
	log.Println("[pta-agent] Shutting down.")
	os.Exit(0)
}
