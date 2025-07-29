import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useAuth } from "@/context/AuthContext";
import withRoleGuard from "@/hoc/withRoleGuard";

function BillDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [bill, setBill] = useState(null);

  useEffect(() => {
    if (id && user?.access) {
      fetch(`/api/bills/${id}/`, {
        headers: { Authorization: `Bearer ${user.access}` },
      })
        .then((res) => res.json())
        .then((data) => setBill(data))
        .catch((err) => console.error("Error loading bill:", err));
    }
  }, [id, user]);

  const handlePrint = () => window.print();

  if (!bill) {
    return <p className="p-4">Loading bill details...</p>;
  }

  const billUrl = `${process.env.NEXT_PUBLIC_API_URL.replace("/api", "")}/bills/${id}`;

  const subtotal = bill.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gst = parseFloat((bill.total_amount - subtotal).toFixed(2));

  return (
    <div className="max-w-3xl mx-auto my-8 p-6 border rounded shadow bg-white print:bg-white print:shadow-none print:p-0 print:m-0">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-2xl font-bold">Bill Details</h1>
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Print
        </button>
      </div>

      <div className="mb-4">
        <p><strong>Receipt #:</strong> {bill.receipt_number}</p>
        <p><strong>Customer:</strong> {bill.customer_name} ({bill.customer_phone})</p>
        <p><strong>Date:</strong> {new Date(bill.created_at).toLocaleString()}</p>
        <p><strong>Type:</strong> {bill.bill_type}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Items</h2>
        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Item</th>
              <th className="p-2 border">Qty</th>
              <th className="p-2 border">Price</th>
              <th className="p-2 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, idx) => (
              <tr key={idx}>
                <td className="p-2 border">{item.name}</td>
                <td className="p-2 border">{item.quantity}</td>
                <td className="p-2 border">₹{item.price}</td>
                <td className="p-2 border">₹{item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-4 text-right">
        <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
        {gst > 0 && <p>GST (5%): ₹{gst.toFixed(2)}</p>}
        <p className="text-lg font-bold">Grand Total: ₹{bill.total_amount.toFixed(2)}</p>
      </div>

      {/* QR code - hide in print */}
      <div className="mt-6 text-center print:hidden">
        <p className="mb-2 text-sm text-gray-500">Scan to view bill online</p>
        <div className="inline-block bg-white p-2 border rounded">
          <QRCode value={billUrl} size={128} />
        </div>
      </div>
    </div>
  );
}

export default withRoleGuard(BillDetail, ["admin", "staff"]);

