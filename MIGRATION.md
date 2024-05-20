# Migration

## Migrating from v3 t v4

The `graphite-threshold` check has now been removed in line with the deprecation of the Graphite service. We recommend removing this check from your code and following [Edge Delivery and Observability's guide to replacing Graphite](https://financialtimes.atlassian.net/wiki/spaces/DS/pages/8408989698/Migrating+an+app+away+from+Graphite-based+health+checks):

```diff
const health = new HealthCheck({
    checks: [
-        {
-		name: 'ES Search',
-		id: 'es-search',
-		severity: 3,
-		businessImpact: 'Unable to add related content to videos, potentially impacting engagement',
-		technicalSummary: 'Check there hasn’t been a 500 response from the Elasticsearch search endpoint in the last 10 minutes',
-		panicGuide: 'Check Grafana,
-		type: 'graphite-threshold',
-		graphiteKey: process.env.FT_GRAPHITE_KEY,
-		direction: 'above',
-		threshold: 0
-	},
    {
        type: 'disk-space',
        threshold: 80,
        interval: 15000,
        id: 'system-disk-space',
        name: 'System Disk Space Usage',
        severity: 2,
        businessImpact: 'New files may not be saved',
        technicalSummary: 'Something went wrong!',
        panicGuide: "Don't panic",
    },
  ]
});
```

## Migrating from v2 to v3

Check your project runs on node 18 or above; support has been removed for lower versions of node.

## Migrating from v1 to v2

Check your project runs on node 10 or above; support has been removed for lower versions of node.
