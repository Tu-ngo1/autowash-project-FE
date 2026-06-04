export const RecentTransactions = ({ transactions = [] }) => (
  <div className="bg-surface-container border border-surface-container-highest flex flex-col">
    <div className="p-4 border-b border-surface-container-highest bg-surface-container-lowest flex justify-between items-center">
      <span className="font-label-caps text-on-surface">GIAO DỊCH GẦN ĐÂY</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-surface-container-highest bg-[#0a101f]">
            {[
              "MÃ ĐƠN",
              "KHÁCH HÀNG",
              "BIỂN SỐ",
              "THANH TOÁN",
              "TRẠNG THÁI",
              "TỔNG TIỀN",
            ].map((h) => (
              <th
                key={h}
                className="p-4 font-label-caps text-outline font-normal"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-data-display text-[14px]">
          {transactions.map((tx) => (
            <tr
              key={tx.id}
              className="border-b border-surface-container-highest hover:bg-surface-variant transition-colors cursor-pointer"
            >
              <td className="p-4 text-primary">#{tx.id}</td>
              <td className="p-4 text-on-surface">{tx.customer}</td>
              <td className="p-4 text-on-surface-variant">{tx.plate}</td>
              <td className="p-4">
                <span className="px-2 py-1 border border-primary text-primary text-[10px] uppercase">
                  {tx.method}
                </span>
              </td>
              <td className="p-4 text-secondary">{tx.status}</td>
              <td className="p-4 text-right text-on-surface">{tx.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
