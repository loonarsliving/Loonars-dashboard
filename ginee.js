import crypto from "crypto";

const GINEE_HOST = process.env.GINEE_HOST || "https://openapi.ginee.com";
const ACCESS_KEY = process.env.GINEE_ACCESS_KEY;
const SECRET_KEY = process.env.GINEE_SECRET_KEY;

function buildSignature(method, path) {
  const signatureStr = `${method}$${path}$`;
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(signatureStr)
    .digest("base64");
  return `${ACCESS_KEY}:${signature}`;
}

async function gineeRequest(method, path, body = null) {
  const auth = buildSignature(method, path);
  const options = {
    method,
    headers: {
      Authorization: auth,
      "X-Advai-Country": "ID",
      "Content-Type": "application/json",
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${GINEE_HOST}${path}`, options);
  return res.json();
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!ACCESS_KEY || !SECRET_KEY) {
    return res.status(500).json({ error: "Ginee API keys tidak ditemukan di environment variables" });
  }

  const { action } = req.query;

  try {
    let data;

    switch (action) {
      // --- ORDERS ---
      case "orders": {
        const { page = 0, size = 50, status, dateFrom, dateTo } = req.query;
        const body = { page: Number(page), size: Number(size) };
        if (status) body.orderStatus = status;
        if (dateFrom) body.createAtFrom = dateFrom;
        if (dateTo) body.createAtTo = dateTo;
        data = await gineeRequest("POST", "/openapi/order/v1/list", body);
        break;
      }

      case "order-detail": {
        const { orderId } = req.query;
        data = await gineeRequest("POST", "/openapi/order/v1/batch-get", {
          orderIds: [orderId],
        });
        break;
      }

      // --- INVENTORY / STOK ---
      case "inventory": {
        const { page = 0, size = 50 } = req.query;
        data = await gineeRequest("POST", "/openapi/warehouse-inventory/v1/sku/list", {
          page: Number(page),
          size: Number(size),
        });
        break;
      }

      // --- SUMMARY DASHBOARD ---
      case "summary": {
        const today = new Date();
        const from = new Date(today);
        from.setDate(from.getDate() - 30);

        const [orders, inventory] = await Promise.all([
          gineeRequest("POST", "/openapi/order/v1/list", {
            page: 0,
            size: 100,
            createAtFrom: from.toISOString(),
            createAtTo: today.toISOString(),
          }),
          gineeRequest("POST", "/openapi/warehouse-inventory/v1/sku/list", {
            page: 0,
            size: 100,
          }),
        ]);

        const orderList = orders?.data?.orderList || [];
        const totalRevenue = orderList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const byChannel = orderList.reduce((acc, o) => {
          acc[o.channel] = (acc[o.channel] || 0) + 1;
          return acc;
        }, {});
        const byStatus = orderList.reduce((acc, o) => {
          acc[o.orderStatus] = (acc[o.orderStatus] || 0) + 1;
          return acc;
        }, {});

        data = {
          code: "SUCCESS",
          data: {
            totalOrders: orderList.length,
            totalRevenue,
            byChannel,
            byStatus,
            totalSKU: inventory?.data?.total || 0,
            lowStock: (inventory?.data?.list || []).filter(
              (i) => (i.availableStock || 0) < 10
            ).length,
          },
        };
        break;
      }

      default:
        return res.status(400).json({ error: `Action '${action}' tidak dikenal` });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Ginee API Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
