export const environment = {
  production: true,
  apiUrl: '/api', // el Ingress reescribe /api -> api-gateway (ver k8s/22-ingress.yaml)
};
