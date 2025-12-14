let _janusConfig = null;

export const setJanusConfig = config => {
  if (!config) {
    throw new Error('janus config is not valid');
  }

  if (!config.gateways || !config.ice_servers) {
    throw new Error('janus config is not valid');
  }

  _janusConfig = config;
};

export const gatewayNames = (type = 'rooms') => {
  if (!_janusConfig.gateways?.[type]) {
    return [];
  }
  return Object.keys(_janusConfig.gateways[type]);
};

export const configByName = name => {
  const { gateways, ice_servers } = _janusConfig;

  let gateway = null;
  for (const type in gateways) {
    const _gateways = gateways[type];
    if (_gateways?.[name]) {
      gateway = _gateways[name];
      break;
    }
  }

  if (!gateway) {
    throw new Error(`unknown gateway ${name}`);
  }

  if (!gateway.type) {
    throw new Error(`gateway ${name} has no type`);
  }

  if (!ice_servers[gateway.type]) {
    throw new Error(`ice_servers for type ${gateway.type} not found`);
  }

  return {
    ...gateway,
    iceServers: ice_servers[gateway.type].map(url => ({
      urls: url,
    })),
  };
};
