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
        .then(setBill)
        .catch((err) => console.error("Error loading bill:", err));
    }
  }, [id, user]);

  const handlePrint = () => window.print();

  if (!bill) {
    return <p className="p-4">Loading bill details...</p>;
  }

  // Compute billing details
  const subtotal = bill.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discountItem = bill.items.find(i => i.item_name === "Discount") || { price: 0 };
  const discountAmount = Math.abs(discountItem.price);
  const taxableAmount = subtotal - discountAmount;
  const gstAmount = parseFloat((bill.total_amount - taxableAmount).toFixed(2));
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  // URL for QR code
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const billUrl = `${origin}/bills/${id}`;

  return (
    <div className="max-w-md mx-auto my-8 bg-white p-6 border rounded-lg print:px-0 print:border-none">
      {/* Header */}
      <div className="text-center mb-4 print:hidden">
        <h2 className="text-2xl font-bold">🧾 HOTEL RESTAURANT</h2>
        <p className="text-gray-600">D-mart Style Receipt</p>
      </div>

      {/* Receipt Info */}
      <div className="mb-4">
        <p><strong>Receipt:</strong> {bill.receipt_number}</p>
        <p><strong>Date:</strong> {new Date(bill.created_at).toLocaleString()}</p>
        <p><strong>Customer:</strong> {bill.customer_name || "Guest"}</p>
      </div>

      {/* Items */}
      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="pb-2 text-left">Item</th>
              <th className="pb-2 text-center">Qty</th>
              <th className="pb-2 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, idx) => (
              item.item_name !== "Discount" && (
                <tr key={idx} className="border-b">
                  <td className="py-1">{item.item_name}</td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-4 text-right space-y-1">
        <div><span className="inline-block w-24 text-left">Subtotal:</span> ₹{subtotal.toFixed(2)}</div>
        {discountAmount > 0 && (
          <div><span className="inline-block w-24 text-left">Discount:</span> -₹{discountAmount.toFixed(2)}</div>
        )}
        <div><span className="inline-block w-24 text-left">Taxable:</span> ₹{taxableAmount.toFixed(2)}</div>
        <div><span className="inline-block w-24 text-left">CGST (9%):</span> ₹{cgst.toFixed(2)}</div>
        <div><span className="inline-block w-24 text-left">SGST (9%):</span> ₹{sgst.toFixed(2)}</div>
        <div className="font-bold text-lg"><span className="inline-block w-24 text-left">Total:</span> ₹{bill.total_amount.toFixed(2)}</div>
      </div>

      {/* QR Code & Footer */}
      <div className="mt-6 text-center print:hidden">
        <QRCode value={billUrl} size={96} />
        <p className="text-xs text-gray-500 mt-1">Scan to view online</p>
      </div>

      {/* Print button */}
      <div className="text-center mt-4 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Print Receipt
        </button>
      </div>
    </div>
  );
}

export default withRoleGuard(BillDetail, ["admin", "staff"]);

