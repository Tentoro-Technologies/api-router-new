var config = {};

config.proxy = {};

config.proxy.host = "http://localhost:3000";
config.proxy.suffix = "/q";

config.kube = {};
config.kube._cluster_url = "http://ifs.svc.io";

config.base = {};
config.base._app_url = "/service/definitions";

config.modeller = {};
config.modeller.form = "http://151.106.38.94:31501/modellerService/form/content";



config.notice = {};
config.notice.base = "http://151.106.38.94:31601/app";

module.exports = config;
