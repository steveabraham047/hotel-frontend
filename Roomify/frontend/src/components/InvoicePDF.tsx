import React, { useRef } from 'react';

interface InvoiceData {
  invoice_id?: number;
  invoice_no: string;
  room_total: string | number;
  restaurant_total: string | number;
  addon_total?: string | number;
  addon_items?: string;
  grand_total: string | number;
  payment_status: string;
  check_in: string;
  check_out: string;
  room_number: string;
  room_type: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
}

interface InvoicePDFProps {
  invoice: InvoiceData;
  guestName?: string;
  guestEmail?: string;
  onClose?: () => void;
}

const fmtCurrency = (v: string | number) => Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtDate = (v: string) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, guestName, guestEmail, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const roomTotal = Number(invoice.room_total);
  const restaurantTotal = Number(invoice.restaurant_total);
  const addonTotal = Number(invoice.addon_total || 0);
  const grandTotal = Number(invoice.grand_total);

  const addons: { title: string; price: number }[] = [];
  if (invoice.addon_items) {
    invoice.addon_items.split('||').filter(Boolean).forEach(item => {
      const [title, price] = item.split('::');
      if (title) addons.push({ title, price: Number(price || 0) });
    });
  }

  const handleDownload = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>${invoice.invoice_no} - Paramvah Stays</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; padding:40px; color:#1a1a1a; background:#f4fbf9; }
        .invoice-box { max-width:800px; margin:0 auto; background:#ffffff; padding:48px; border-radius:32px; box-shadow:0 24px 48px rgba(0,107,92,0.08); border:1px solid rgba(0,107,92,0.1); position:relative; overflow:hidden; }
        .invoice-box::before { content:''; position:absolute; top:0; left:0; width:100%; height:8px; background:linear-gradient(90deg, #006B5C, #00C9A7); }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; padding-bottom:24px; border-bottom:2px dashed rgba(0,107,92,0.2); }
        .hotel-name { font-size:36px; font-family:'Manrope',sans-serif; font-weight:900; color:#006B5C; letter-spacing:-1px; }
        .hotel-sub { font-size:12px; color:#006B5C; opacity:0.7; margin-top:4px; font-weight:800; text-transform:uppercase; letter-spacing:3px; }
        .invoice-title { font-size:32px; font-family:'Manrope',sans-serif; font-weight:900; color:#1a1a1a; text-align:right; }
        .invoice-no { font-size:14px; color:#888; text-align:right; margin-top:4px; font-weight:700; }
        .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:32px; }
        .meta-box { background:rgba(0,107,92,0.03); border:1px solid rgba(0,107,92,0.1); border-radius:16px; padding:20px; }
        .meta-label { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; color:#006B5C; opacity:0.8; margin-bottom:8px; }
        .meta-value { font-size:16px; font-weight:800; color:#1a1a1a; }
        table { width:100%; border-collapse:separate; border-spacing:0; margin-bottom:32px; }
        th { text-align:left; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; color:#006B5C; opacity:0.8; padding:16px; background:rgba(0,107,92,0.03); border-radius:12px 0 0 12px; }
        th:last-child { border-radius:0 12px 12px 0; }
        td { padding:16px; border-bottom:1px solid rgba(0,107,92,0.1); font-size:15px; font-weight:600; }
        .total-row td { border-bottom:none; padding-top:24px; background:rgba(0,201,167,0.05); }
        .total-row td:first-child { border-radius:16px 0 0 16px; }
        .total-row td:last-child { border-radius:0 16px 16px 0; }
        .grand-total { font-size:28px; font-family:'Manrope',sans-serif; font-weight:900; color:#006B5C; }
        .footer { margin-top:48px; padding-top:24px; border-top:2px dashed rgba(0,107,92,0.2); text-align:center; font-size:12px; font-weight:600; color:#888; }
        .badge { display:inline-block; background:#00C9A7; color:#fff; padding:6px 16px; border-radius:24px; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:1px; box-shadow:0 4px 12px rgba(0,201,167,0.3); }
        @media print { body { padding:0; background:#fff; } .invoice-box { box-shadow:none; border:none; padding:20px; } .no-print { display:none; } }
      </style>
      </head><body>
      ${printContent.innerHTML}
      <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}<\/script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Action bar */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xl p-4 flex items-center justify-between border-b border-outline-variant/20 rounded-t-3xl z-10">
          <h3 className="font-black text-primary text-lg">Invoice Preview</h3>
          <div className="flex gap-2">
            <button onClick={handleDownload} className="px-5 py-2.5 bg-secondary text-white font-bold rounded-xl flex items-center gap-2 hover:bg-secondary-container transition-all active:scale-95 shadow-lg">
              <span className="material-symbols-outlined text-sm">download</span> Download PDF
            </button>
            {onClose && (
              <button onClick={onClose} className="p-2.5 rounded-xl bg-surface-variant text-primary/50 hover:bg-outline-variant/30 transition-all">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Printable invoice */}
        <div ref={printRef} className="p-8">
          <div className="invoice-box">
            <div className="header">
              <div>
                <div className="hotel-name">Paramvah Stays</div>
                <div className="hotel-sub">Premium Hotel & Resort</div>
              </div>
              <div>
                <div className="invoice-title">INVOICE</div>
                <div className="invoice-no">{invoice.invoice_no}</div>
                <div style={{marginTop:'8px'}}><span className="badge">{invoice.payment_status}</span></div>
              </div>
            </div>

            <div className="meta-grid">
              <div className="meta-box">
                <div className="meta-label">Guest</div>
                <div className="meta-value">{guestName || invoice.guest_name || 'Guest'}</div>
                {(guestEmail || invoice.guest_email) && <div style={{fontSize:'12px',color:'#888',marginTop:'2px'}}>{guestEmail || invoice.guest_email}</div>}
              </div>
              <div className="meta-box">
                <div className="meta-label">Room</div>
                <div className="meta-value">Room {invoice.room_number} — {invoice.room_type}</div>
              </div>
              <div className="meta-box">
                <div className="meta-label">Check-in</div>
                <div className="meta-value">{fmtDate(invoice.check_in)}</div>
              </div>
              <div className="meta-box">
                <div className="meta-label">Check-out</div>
                <div className="meta-value">{fmtDate(invoice.check_out)}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr><th>Description</th><th style={{textAlign:'right'}}>Amount</th></tr>
              </thead>
              <tbody>
                <tr><td>Room Charges (incl. 12% GST)</td><td style={{textAlign:'right'}}>₹{fmtCurrency(roomTotal)}</td></tr>
                {restaurantTotal > 0 && <tr><td>Restaurant & Dining (incl. 5% GST)</td><td style={{textAlign:'right'}}>₹{fmtCurrency(restaurantTotal)}</td></tr>}
                {addons.map((a, i) => <tr key={i}><td>{a.title}</td><td style={{textAlign:'right'}}>₹{fmtCurrency(a.price)}</td></tr>)}
                {addonTotal > 0 && addons.length === 0 && <tr><td>Booking Add-ons</td><td style={{textAlign:'right'}}>₹{fmtCurrency(addonTotal)}</td></tr>}
                <tr className="total-row">
                  <td style={{fontWeight:900,fontSize:'18px'}}>Grand Total</td>
                  <td style={{textAlign:'right'}} className="grand-total">₹{fmtCurrency(grandTotal)}</td>
                </tr>
              </tbody>
            </table>

            <div className="footer">
              <p>Thank you for staying with Paramvah Stays.</p>
              <p style={{marginTop:'4px'}}>Phone: +91 98765 43210 &nbsp;|&nbsp; Email: stay@paramvah.example</p>
              <p style={{marginTop:'8px',fontSize:'10px'}}>This is a computer-generated invoice. No signature required.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
