import{r,aF as b,j as e,D as g,i as f,k as h,l as v,B as x,X as u,P as y}from"./index-f386841f.js";const N=({voucher:t,isOpen:s,onClose:o,voucherType:d})=>{const[p,l]=r.useState(!1),[i,c]=r.useState("");if(r.useEffect(()=>{s&&t&&t.voucher_code?(console.log("Generating QR code for:",t.voucher_code),l(!1),c(""),b.toDataURL(t.voucher_code,{width:200,margin:2,color:{dark:"#000000",light:"#ffffff"}},(a,n)=>{a?(console.error("QR Code generation error:",a),l(!0)):(console.log("QR Code generated successfully"),c(n))})):console.log("QR Code generation skipped:",{isOpen:s,hasVoucher:!!t,hasCode:!!(t!=null&&t.voucher_code)})},[s,t]),!t)return null;const m=()=>{const a=window.open("","_blank"),n=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Voucher - ${t.voucher_code}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; }
          .voucher { max-width: 800px; margin: 0 auto; border: 2px solid #ccc; padding: 40px; }
          .header { text-align: center; border-bottom: 4px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { font-size: 32px; color: #10b981; margin-bottom: 5px; }
          .header p { font-size: 16px; color: #666; }
          .content { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .info-section { display: flex; flex-direction: column; gap: 15px; }
          .info-box { background: #f9fafb; padding: 12px; border-radius: 5px; }
          .info-label { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
          .info-value { font-size: 18px; font-weight: bold; color: #111; }
          .qr-section { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; }
          .qr-section img { border: 2px solid #ddd; border-radius: 5px; }
          .voucher-code { font-size: 24px; font-weight: bold; color: #10b981; font-family: 'Courier New', monospace; letter-spacing: 2px; word-break: break-all; text-align: center; }
          .status-badge { display: inline-block; padding: 8px 16px; background: #10b981; color: white; border-radius: 20px; font-size: 14px; font-weight: bold; margin-top: 10px; }
          .footer { border-top: 2px solid #e5e7eb; padding-top: 20px; text-align: center; font-size: 12px; color: #666; }
          .footer p { margin-bottom: 8px; }
          @media print {
            body { padding: 0; }
            .voucher { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="voucher">
          <div class="header">
            <h1>🌿 PNG Green Fees</h1>
            <p>Environmental Exit Voucher</p>
          </div>

          <div class="content">
            <div class="info-section">
              <div class="info-box">
                <div class="info-label">Voucher Type</div>
                <div class="info-value">${d}</div>
              </div>
              <div class="info-box">
                <div class="info-label">Passport Number</div>
                <div class="info-value">${t.passport_number}</div>
              </div>
              ${t.company_name?`
              <div class="info-box">
                <div class="info-label">Company Name</div>
                <div class="info-value">${t.company_name}</div>
              </div>
              `:""}
              <div class="info-box">
                <div class="info-label">Valid Until</div>
                <div class="info-value">${new Date(t.valid_until).toLocaleDateString()}</div>
              </div>
              <div class="info-box">
                <div class="info-label">Amount</div>
                <div class="info-value">PGK ${t.amount}</div>
              </div>
            </div>

            <div class="qr-section">
              <img src="${i}" alt="QR Code" width="200" height="200" />
              <div class="voucher-code">${t.voucher_code}</div>
              <span class="status-badge">✓ VALID</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>Instructions:</strong> Present this voucher at the airport exit. Scan the QR code or enter the code manually for validation.</p>
            <p>Issued by Papua New Guinea Department of Environment</p>
            <p>Payment Method: ${t.payment_method} | Issued: ${new Date(t.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;a.document.write(n),a.document.close(),a.onload=function(){a.print(),a.onafterprint=function(){a.close()}}};return e.jsx(g,{open:s,onOpenChange:o,children:e.jsxs(f,{className:"max-w-3xl max-h-[90vh] overflow-y-auto",children:[e.jsx(h,{className:"no-print",children:e.jsx(v,{children:"Print Voucher"})}),e.jsx("style",{children:`
          @media print {
            body * {
              visibility: hidden;
            }
            .voucher-printable,
            .voucher-printable * {
              visibility: visible;
            }
            .voucher-printable {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}),e.jsx("div",{className:"print-area",children:e.jsxs("div",{className:"voucher-printable bg-white p-8 rounded-lg border-2 border-gray-200",children:[e.jsxs("div",{className:"text-center border-b-4 border-green-600 pb-6 mb-6",children:[e.jsx("h1",{className:"text-4xl font-bold text-green-600 mb-2",children:"🌿 PNG Green Fees"}),e.jsx("p",{className:"text-lg text-gray-600",children:"Environmental Exit Voucher"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-8 mb-6",children:[e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"bg-gray-50 p-3 rounded",children:[e.jsx("div",{className:"text-xs text-gray-500 uppercase mb-1",children:"Voucher Type"}),e.jsx("div",{className:"text-lg font-bold text-gray-900",children:d})]}),e.jsxs("div",{className:"bg-gray-50 p-3 rounded",children:[e.jsx("div",{className:"text-xs text-gray-500 uppercase mb-1",children:"Passport Number"}),e.jsx("div",{className:"text-lg font-bold text-gray-900",children:t.passport_number})]}),t.company_name&&e.jsxs("div",{className:"bg-gray-50 p-3 rounded",children:[e.jsx("div",{className:"text-xs text-gray-500 uppercase mb-1",children:"Company Name"}),e.jsx("div",{className:"text-lg font-bold text-gray-900",children:t.company_name})]}),e.jsxs("div",{className:"bg-gray-50 p-3 rounded",children:[e.jsx("div",{className:"text-xs text-gray-500 uppercase mb-1",children:"Valid Until"}),e.jsx("div",{className:"text-lg font-bold text-gray-900",children:new Date(t.valid_until).toLocaleDateString()})]}),e.jsxs("div",{className:"bg-gray-50 p-3 rounded",children:[e.jsx("div",{className:"text-xs text-gray-500 uppercase mb-1",children:"Amount"}),e.jsxs("div",{className:"text-lg font-bold text-gray-900",children:["PGK ",t.amount]})]})]}),e.jsxs("div",{className:"flex flex-col items-center justify-center space-y-4",children:[p?e.jsx("div",{className:"w-[200px] h-[200px] border-2 border-red-300 rounded flex items-center justify-center bg-red-50",children:e.jsx("p",{className:"text-red-600 text-sm text-center px-4",children:"QR Code generation failed"})}):i?e.jsx("img",{src:i,alt:"QR Code",className:"w-[200px] h-[200px] border-2 border-gray-200 rounded"}):e.jsx("div",{className:"w-[200px] h-[200px] border-2 border-gray-300 rounded flex items-center justify-center bg-gray-50",children:e.jsx("p",{className:"text-gray-500 text-sm",children:"Generating QR Code..."})}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-2xl font-bold text-green-600 font-mono tracking-wider break-all",children:t.voucher_code}),e.jsx("div",{className:"mt-2",children:e.jsx("span",{className:"inline-block px-4 py-2 bg-green-600 text-white rounded-full text-sm font-bold",children:"✓ VALID"})})]})]})]}),e.jsxs("div",{className:"border-t-2 border-gray-200 pt-4 text-center text-sm text-gray-600",children:[e.jsxs("p",{className:"mb-2",children:[e.jsx("strong",{children:"Instructions:"})," Present this voucher at the airport exit. Scan the QR code or enter the code manually for validation."]}),e.jsx("p",{className:"mb-1",children:"Issued by Papua New Guinea Department of Environment"}),e.jsxs("p",{className:"text-xs",children:["Payment Method: ",t.payment_method," | Issued: ",new Date(t.created_at).toLocaleDateString()]})]})]})}),e.jsxs("div",{className:"flex justify-end gap-2 mt-4 no-print",children:[e.jsxs(x,{variant:"outline",onClick:o,children:[e.jsx(u,{className:"w-4 h-4 mr-2"}),"Close"]}),e.jsxs(x,{onClick:m,children:[e.jsx(y,{className:"w-4 h-4 mr-2"}),"Print Voucher"]})]})]})})};export{N as V};
