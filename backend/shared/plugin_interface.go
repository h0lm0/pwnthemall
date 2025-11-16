package shared

import (
	"errors"
	"net/rpc"

	"github.com/hashicorp/go-plugin"
)

type LoadedPlugin struct {
	Client   *plugin.Client
	Plugin   Plugin
	Metadata PluginMetadata
}

var LoadedPlugins = make(map[string]*LoadedPlugin)

type Plugin interface {
	GetMetadata() PluginMetadata
	RegisterRoutes(routeRegistrar RouteRegistrar) error
	Initialize(config map[string]interface{}) error
	Shutdown() error
}

type PluginMetadata struct {
	Name        string
	Version     string
	Description string
	Author      string
	Type        string            // "vm", "sso", "storage", etc.
	EnvVars     map[string]string // Variables d'environnement du plugin
}

type RouteInfo struct {
	Method  string // "GET", "POST", etc.
	Path    string
	Handler string
}

type RouteRegistrar interface {
	RegisterRoute(method, path, handlerName string)
}

type RPCError struct {
	Error string
}

type InitializeResponse struct {
	Error string // Vide si pas d'erreur
}

type ShutdownResponse struct {
	Error string // Vide si pas d'erreur
}

type PluginRPC struct {
	client *rpc.Client
}

func (p *PluginRPC) GetMetadata() PluginMetadata {
	var resp PluginMetadata
	p.client.Call("Plugin.GetMetadata", new(interface{}), &resp)
	return resp
}

func (p *PluginRPC) RegisterRoutes(registrar RouteRegistrar) error {
	var routes []RouteInfo
	err := p.client.Call("Plugin.GetRoutes", new(interface{}), &routes)
	if err != nil {
		return err
	}

	for _, route := range routes {
		registrar.RegisterRoute(route.Method, route.Path, route.Handler)
	}
	return nil
}

func (p *PluginRPC) Initialize(config map[string]interface{}) error {
	var resp InitializeResponse
	err := p.client.Call("Plugin.Initialize", config, &resp)
	if err != nil {
		return err
	}
	if resp.Error != "" {
		return errors.New(resp.Error)
	}
	return nil
}

func (p *PluginRPC) Shutdown() error {
	var resp ShutdownResponse
	err := p.client.Call("Plugin.Shutdown", new(interface{}), &resp)
	if err != nil {
		return err
	}
	if resp.Error != "" {
		return errors.New(resp.Error)
	}
	return nil
}

func (p *PluginRPC) HandleRequest(handlerName string, request RequestData) (ResponseData, error) {
	args := &HandleRequestArgs{
		HandlerName: handlerName,
		Request:     request,
	}
	var resp ResponseData
	err := p.client.Call("Plugin.HandleRequest", args, &resp)
	return resp, err
}

type RequestData struct {
	Method  string
	Path    string
	Headers map[string][]string
	Body    []byte
	Query   map[string][]string
}

type ResponseData struct {
	StatusCode int
	Headers    map[string]string
	Body       []byte
}

type HandleRequestArgs struct {
	HandlerName string
	Request     RequestData
}

type PluginRPCServer struct {
	Impl Plugin
}

func (s *PluginRPCServer) GetMetadata(args interface{}, resp *PluginMetadata) error {
	*resp = s.Impl.GetMetadata()
	return nil
}

func (s *PluginRPCServer) GetRoutes(args interface{}, resp *[]RouteInfo) error {
	registrar := &routeCollector{routes: []RouteInfo{}}
	err := s.Impl.RegisterRoutes(registrar)
	*resp = registrar.routes
	return err
}

func (s *PluginRPCServer) Initialize(config map[string]interface{}, resp *InitializeResponse) error {
	err := s.Impl.Initialize(config)
	if err != nil {
		resp.Error = err.Error()
	}
	return nil
}

func (s *PluginRPCServer) Shutdown(args interface{}, resp *ShutdownResponse) error {
	err := s.Impl.Shutdown()
	if err != nil {
		resp.Error = err.Error()
	}
	return nil
}

func (s *PluginRPCServer) HandleRequest(args *HandleRequestArgs, resp *ResponseData) error {
	if handler, ok := s.Impl.(RequestHandler); ok {
		result, err := handler.HandleRequest(args.HandlerName, args.Request)
		*resp = result
		return err
	}
	return nil
}

type RequestHandler interface {
	HandleRequest(handlerName string, request RequestData) (ResponseData, error)
}

type routeCollector struct {
	routes []RouteInfo
}

func (r *routeCollector) RegisterRoute(method, path, handlerName string) {
	r.routes = append(r.routes, RouteInfo{
		Method:  method,
		Path:    path,
		Handler: handlerName,
	})
}

type GenericPlugin struct {
	Impl Plugin
}

func (p *GenericPlugin) Server(*plugin.MuxBroker) (interface{}, error) {
	return &PluginRPCServer{Impl: p.Impl}, nil
}

func (GenericPlugin) Client(b *plugin.MuxBroker, c *rpc.Client) (interface{}, error) {
	return &PluginRPC{client: c}, nil
}
