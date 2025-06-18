# Monitoring with Prometheus and Grafana

This guide explains how to use the monitoring setup with Prometheus and Grafana for the LOG430 lab application.

## Overview

The monitoring setup includes:

- **Prometheus**: Collects and stores metrics from the server application
- **Grafana**: Visualizes the metrics collected by Prometheus

## Accessing the Monitoring Tools

### Docker Compose

When running with Docker Compose:

- Prometheus UI: http://localhost:9090
- Grafana Dashboard: http://localhost:3001 (login: admin/admin)

### Kubernetes

When running in Kubernetes, you'll need to port-forward to access the services:

```bash
# For Prometheus
kubectl port-forward svc/prometheus 9090:9090

# For Grafana
kubectl port-forward svc/grafana 3001:3000
```

