class GxyConfig {
  static globalConfig = {};

  static setGlobalConfig = (config) => {
    GxyConfig.globalConfig = config;
  };

  static instanceConfig = (name) => {
    let gateway = null;
    Object.entries(GxyConfig.globalConfig.gateways).forEach(([type, gateways]) => {
      if (!gateway) {
        gateway = gateways[name];
      }
    });

    if (!gateway) {
      throw new Error(`unknown gateway ${name}`);
    }

    return {
      ...gateway,
      iceServers: GxyConfig.globalConfig.ice_servers[gateway.type].map((url) => ({ urls: url })),
    };
  };

  static gatewayNames = (type = 'rooms') => Object.keys(GxyConfig.globalConfig.gateways[type]);

}

export default GxyConfig;
