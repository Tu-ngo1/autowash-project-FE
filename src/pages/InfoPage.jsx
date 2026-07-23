import { Link } from "react-router-dom";

const pages = {
  about: {
    title: "Về chúng tôi",
    intro:
      "autoWash cung cấp trải nghiệm đặt lịch rửa xe trực tuyến, giúp khách hàng chọn xe, dịch vụ, ngày giờ và phương thức thanh toán rõ ràng trước khi đến cửa hàng.",
    sections: [
      {
        heading: "Mục tiêu vận hành",
        items: [
          "Hiển thị dịch vụ, phụ phí và tổng tiền minh bạch trước khi xác nhận.",
          "Ưu tiên đặt lịch theo khung giờ còn trống để hạn chế chờ đợi.",
          "Hỗ trợ khách hàng theo dõi lịch sử đặt lịch, trạng thái thanh toán và ưu đãi thành viên.",
        ],
      },
      {
        heading: "Phạm vi dịch vụ",
        items: [
          "Dịch vụ rửa xe chính và dịch vụ cộng thêm phụ thuộc vào cấu hình đang hoạt động của hệ thống.",
          "Thời lượng rửa được tính theo tổng thời gian của dịch vụ chính và các dịch vụ cộng thêm.",
          "Khung giờ đặt lịch phụ thuộc vào giờ hoạt động, ngày nghỉ và năng lực phục vụ trong ngày.",
        ],
      },
    ],
  },
  terms: {
    title: "Điều khoản dịch vụ",
    intro:
      "Khi xác nhận đặt lịch, khách hàng đồng ý tuân thủ các quy định đặt lịch, thanh toán, hủy lịch và sử dụng ưu đãi của autoWash.",
    sections: [
      {
        heading: "Đặt lịch",
        items: [
          "Khách hàng cần chọn xe, dịch vụ, ngày và khung giờ còn trống trước khi xác nhận.",
          "Mỗi lịch hẹn chỉ hợp lệ khi hệ thống tạo đơn thành công và có thông tin thời gian rõ ràng.",
          "Khách hàng nên đến đúng giờ đã chọn để cửa hàng đảm bảo tiến độ phục vụ.",
        ],
      },
      {
        heading: "Thanh toán",
        items: [
          "Tổng tiền được tính từ dịch vụ chính, dịch vụ cộng thêm, ưu đãi hạng thành viên và voucher nếu có.",
          "Thanh toán qua ví chỉ khả dụng khi số dư đủ để chi trả tổng tiền sau giảm giá.",
          "Thanh toán qua cổng PayOS sẽ được xác nhận theo trạng thái trả về từ hệ thống thanh toán.",
        ],
      },
      {
        heading: "Hủy lịch và hoàn tiền",
        items: [
          "Lịch đã hoàn thành không thể hủy.",
          "Yêu cầu hủy lịch có thể cần nhân viên hoặc quản trị viên xác nhận tùy trạng thái đơn.",
          "Nếu đơn đã thanh toán và đủ điều kiện hủy, việc hoàn tiền sẽ thực hiện theo trạng thái thanh toán và chính sách cửa hàng.",
        ],
      },
      {
        heading: "Voucher và hạng thành viên",
        items: [
          "Voucher chỉ áp dụng khi còn hiệu lực, còn lượt dùng và đáp ứng điều kiện của chương trình.",
          "Ưu đãi hạng thành viên được tính theo cấu hình hiện hành tại thời điểm đặt lịch.",
          "Hệ thống có quyền từ chối voucher không hợp lệ hoặc đã được sử dụng quá giới hạn.",
        ],
      },
    ],
  },
  privacy: {
    title: "Chính sách bảo mật",
    intro:
      "autoWash chỉ sử dụng thông tin khách hàng cho mục đích vận hành đặt lịch, chăm sóc xe, thanh toán và hỗ trợ sau dịch vụ.",
    sections: [
      {
        heading: "Thông tin được sử dụng",
        items: [
          "Thông tin tài khoản như họ tên, số điện thoại, email và trạng thái thành viên.",
          "Thông tin xe như biển số, mẫu xe, kích thước xe và lịch sử dịch vụ.",
          "Thông tin đặt lịch, thanh toán, voucher và phản hồi khách hàng.",
        ],
      },
      {
        heading: "Mục đích xử lý",
        items: [
          "Xác nhận khách hàng, xe và lịch hẹn.",
          "Tính giá, áp dụng ưu đãi, xử lý thanh toán và hoàn tiền khi cần.",
          "Cải thiện chất lượng vận hành, chăm sóc khách hàng và bảo vệ an toàn hệ thống.",
        ],
      },
      {
        heading: "Cam kết bảo mật",
        items: [
          "Không bán thông tin cá nhân của khách hàng cho bên thứ ba.",
          "Chỉ chia sẻ dữ liệu khi cần thiết cho thanh toán, vận hành dịch vụ hoặc theo yêu cầu pháp luật.",
          "Khách hàng có thể liên hệ autoWash để được hỗ trợ kiểm tra hoặc cập nhật thông tin cá nhân.",
        ],
      },
    ],
  },
};

export default function InfoPage({ page = "about" }) {
  const content = pages[page] || pages.about;

  return (
    <main className="flex min-h-screen flex-col bg-white text-slate-950">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-10 sm:px-8 lg:py-14">
        <Link
          to="/booking"
          className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-700 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-100"
        >
          <span className="material-symbols-outlined text-base">
            arrow_back
          </span>
          Quay lại đặt lịch
        </Link>

        <header className="border-b border-slate-200 pb-6">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            autoWash
          </p>
          <h1 className="text-3xl font-black sm:text-4xl">{content.title}</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
            {content.intro}
          </p>
        </header>

        <div className="space-y-8">
          {content.sections.map((section) => (
            <section key={section.heading} className="space-y-3">
              <h2 className="text-xl font-black text-slate-900">
                {section.heading}
              </h2>
              <ul className="space-y-2 text-sm font-semibold leading-7 text-slate-600">
                {section.items.map((item) => (
                  <li key={item} className="border-l-2 border-cyan-200 pl-4">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
