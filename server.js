import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));


const ORDERS = {};


const ESEWA_FORM_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";


const ESEWA_PRODUCT_CODE = "EPAYTEST";
const ESEWA_SECRET_KEY = "8gBm/:&EnhH.1/q";


function serverOrigin(req) {
    return `${req.protocol}://${req.get("host")}`;
}


function generateSignature(total_amount, transaction_uuid, product_code) {
    const signed_field_names = "total_amount,transaction_uuid,product_code";
    const dataToSign = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    return crypto
        .createHmac("sha256", ESEWA_SECRET_KEY)
        .update(dataToSign)
        .digest("base64");
}




app.post("/pay", (req, res) => {
    const { amount, pid } = req.body;
    if (!amount || !pid) {
        return res.status(400).send("Missing amount or pid");
    }

    ORDERS[pid] = {
        id: pid,
        amount,
        status: "INITIATED",
        createdAt: new Date().toISOString(),
    };

    const origin = serverOrigin(req);
    const successUrl = `${origin}/esewa/success`;
    const failureUrl = `${origin}/esewa/failure`;

    const amt = Number(amount);
    const tax_amount = 0;
    const product_service_charge = 0;
    const product_delivery_charge = 0;
    const total_amount =
        amt + tax_amount + product_service_charge + product_delivery_charge;

    const signed_field_names = "total_amount,transaction_uuid,product_code";
    const transaction_uuid = pid;
    const product_code = ESEWA_PRODUCT_CODE;

    const signature = generateSignature(
        total_amount,
        transaction_uuid,
        product_code
    );


    const html = `
  <!doctype html>
  <html>
    <head><meta charset="utf-8"><title>Redirecting to eSewa...</title></head>
    <body>
      <p>Redirecting to eSewa test gateway... please wait.</p>
      <form id="esewaForm" action="${ESEWA_FORM_URL}" method="POST">
        <input type="hidden" name="amount" value="${amount}">
        <input type="hidden" name="tax_amount" value="${tax_amount}">
        <input type="hidden" name="total_amount" value="${total_amount}">
        <input type="hidden" name="transaction_uuid" value="${transaction_uuid}">
        <input type="hidden" name="product_code" value="${product_code}">
        <input type="hidden" name="product_service_charge" value="0">
        <input type="hidden" name="product_delivery_charge" value="0">
        <input type="hidden" name="success_url" value="${successUrl}">
        <input type="hidden" name="failure_url" value="${failureUrl}">
        <input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code">
        <input type="hidden" name="signature" value="${signature}">
        <button type="submit">Continue to eSewa</button>
      </form>
      <script>document.getElementById("esewaForm").submit();</script>
    </body>
  </html>`;

    res.send(html);
});


app.get("/esewa/success", (req, res) => {
    const { transaction_uuid } = req.query;
    if (ORDERS[transaction_uuid]) {
        ORDERS[transaction_uuid].status = "PAID";
    }
    res.send(`
      <h2>Payment Successful ✅</h2>
      <p>Your order <b>${transaction_uuid}</b> was paid successfully.</p>
      <a href="/">Return to Home</a>
    `);
});


app.get("/esewa/failure", (req, res) => {
    const { transaction_uuid } = req.query;
    if (ORDERS[transaction_uuid]) {
        ORDERS[transaction_uuid].status = "FAILED";
    }
    res.send(`
      <h2>Payment Failed ❌</h2>
      <p>Order <b>${transaction_uuid}</b> failed or was cancelled.</p>
      <a href="/">Return to Home</a>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Charkose Jhadi server running at http://localhost:${PORT}`);
});
