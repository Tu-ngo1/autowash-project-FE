import { Link } from "react-router-dom";

const effectiveDate = "24/07/2026";
const contactPhone = "0868939477";

const pages = {
  about: {
    label: "Giới thiệu",
    title: "Về autoWash",
    intro:
      "autoWash là hệ thống đặt lịch và vận hành dịch vụ rửa xe, hỗ trợ khách hàng chọn phương tiện, dịch vụ, khung giờ, thanh toán và theo dõi trạng thái xử lý trên một nền tảng thống nhất.",
    sections: [
      {
        heading: "Điều 1: Mô hình hoạt động",
        items: [
          "Khách hàng đăng ký tài khoản, quản lý phương tiện theo biển số xe, hãng xe, mẫu xe và kích thước xe.",
          "Dịch vụ được hiển thị theo kích thước phương tiện để đảm bảo giá, thời lượng và năng lực phục vụ phù hợp.",
          "Nhân viên tiếp nhận xe qua QR/check-in, đưa xe vào hàng chờ, điều phối vào khoang rửa và cập nhật tiến độ xử lý.",
          "Quản trị viên quản lý dịch vụ, khách hàng, đơn đặt lịch, voucher, hạng thành viên và cấu hình vận hành theo ngày.",
        ],
      },
      {
        heading: "Điều 2: Trải nghiệm khách hàng",
        items: [
          "Khách hàng có thể đặt lịch theo ngày và khung giờ còn trống mà hệ thống trả về.",
          "Tổng tiền được tính từ dịch vụ chính, dịch vụ cộng thêm, ưu đãi hạng thành viên và voucher nếu có.",
          "Sau khi hoàn tất dịch vụ, khách hàng có thể đánh giá lượt rửa xe bằng số sao, nhận xét và các lựa chọn nhanh về chất lượng phục vụ.",
        ],
      },
      {
        heading: "Điều 3: Kênh hỗ trợ",
        items: [
          `Khách hàng có thể liên hệ autoWash qua số điện thoại ${contactPhone} khi cần hỗ trợ đặt lịch, thanh toán, hủy lịch hoặc cập nhật thông tin.`,
          "Các yêu cầu liên quan đến dữ liệu tài khoản, phương tiện, ví và lịch sử dịch vụ sẽ được xử lý dựa trên thông tin đang lưu trong hệ thống.",
        ],
      },
    ],
  },
  terms: {
    label: "Điều khoản",
    title: "Điều khoản và điều kiện sử dụng dịch vụ autoWash",
    intro:
      "Bằng việc đăng ký tài khoản, thêm phương tiện, đặt lịch hoặc sử dụng dịch vụ tại autoWash, khách hàng đồng ý tuân thủ các điều khoản dưới đây.",
    sections: [
      {
        heading: "Điều 1: Định nghĩa",
        items: [
          "autoWash là hệ thống cung cấp dịch vụ đặt lịch, tiếp nhận, rửa xe, thanh toán, tích điểm, voucher và quản lý vận hành cửa hàng.",
          "Khách hàng là người tạo tài khoản và sử dụng dịch vụ đặt lịch rửa xe qua hệ thống.",
          "Phương tiện là xe được khách hàng đăng ký bằng biển số, hãng xe, mẫu xe và kích thước xe.",
          "Đơn đặt lịch là yêu cầu sử dụng dịch vụ được tạo thành công, có ngày giờ hẹn, dịch vụ, phương tiện, trạng thái và thông tin thanh toán.",
        ],
      },
      {
        heading: "Điều 2: Đăng ký và quản lý phương tiện",
        items: [
          "Khách hàng cần cung cấp thông tin phương tiện chính xác, gồm biển số xe, hãng xe, mẫu xe và kích thước xe.",
          "Biển số xe cần đúng định dạng hệ thống đang áp dụng, ví dụ 50A-123456.",
          "Hệ thống có thể từ chối tạo lịch nếu phương tiện không hợp lệ, đã bị xóa, ngừng hoạt động hoặc thiếu thông tin mẫu xe/kích thước xe.",
          "Nhân viên chỉ được tạo lịch nhanh cho khách khi tìm thấy khách hàng hoặc phương tiện đã đăng ký trong hệ thống.",
        ],
      },
      {
        heading: "Điều 3: Đặt lịch và khung giờ phục vụ",
        items: [
          "Khách hàng cần chọn phương tiện, dịch vụ, ngày và khung giờ còn trống trước khi xác nhận đặt lịch.",
          "Khung giờ đặt lịch phụ thuộc vào cấu hình vận hành, giờ mở cửa, số ca hoạt động, số khoang rửa và ngày nghỉ do quản trị viên thiết lập.",
          "Nếu cửa hàng được cấu hình đóng cửa hoặc nghỉ trong ngày, hệ thống sẽ chặn lịch đặt mới cho ngày đó.",
          "Khách hàng nên đến đúng giờ hẹn. Trường hợp đến trễ quá giới hạn nghiệp vụ, hệ thống hoặc nhân viên có thể từ chối tiếp nhận theo quy định vận hành.",
        ],
      },
      {
        heading: "Điều 4: Dịch vụ, giá và ưu đãi",
        items: [
          "Dịch vụ chính và dịch vụ cộng thêm được áp dụng theo cấu hình dịch vụ đang hoạt động trong hệ thống.",
          "Giá dịch vụ và thời lượng rửa phụ thuộc vào loại dịch vụ và kích thước phương tiện.",
          "Ưu đãi hạng thành viên được tính theo cấu hình hạng hiện hành tại thời điểm đặt lịch.",
          "Voucher chỉ được áp dụng khi còn hiệu lực, còn lượt dùng, thuộc tài khoản khách hàng và đáp ứng điều kiện của chương trình.",
        ],
      },
      {
        heading: "Điều 5: Thanh toán",
        items: [
          "Khách hàng có thể thanh toán theo các phương thức được hệ thống hỗ trợ, bao gồm ví, tiền mặt tại quầy hoặc PayOS tùy từng luồng đặt lịch.",
          "Thanh toán bằng ví chỉ được chấp nhận khi số dư đủ để thanh toán tổng tiền sau giảm giá.",
          "Với PayOS, trạng thái thanh toán được xác nhận theo kết quả trả về từ cổng thanh toán.",
          "Nếu giao dịch chưa hoàn tất, đơn có thể ở trạng thái chờ thanh toán và cần được xác nhận lại trước khi tiếp nhận dịch vụ.",
        ],
      },
      {
        heading: "Điều 6: Check-in, tiếp nhận và xử lý xe",
        items: [
          "Khách hàng sử dụng mã QR của đơn đặt lịch để nhân viên check-in khi đến cửa hàng.",
          "Sau khi check-in thành công, đơn được chuyển sang trạng thái đã đến và đưa vào hàng chờ điều phối.",
          "Nhân viên điều phối xe vào khoang rửa, bắt đầu rửa, hoàn tất rửa và cập nhật trạng thái theo quy trình vận hành.",
          "Các trạng thái nghiệp vụ gồm chờ xác nhận, đã xác nhận, đã check-in, đang rửa, đã rửa xong, hoàn thành và đã hủy.",
        ],
      },
      {
        heading: "Điều 7: Hủy lịch và hoàn tiền",
        items: [
          "Đơn đã hoàn thành không thể hủy.",
          "Khách hàng hoặc nhân viên có thể gửi yêu cầu hủy tùy trạng thái đơn; một số trường hợp cần quản trị viên duyệt.",
          "Khi đơn đủ điều kiện hủy và đã thanh toán, hệ thống sẽ xử lý hoàn tiền theo chính sách hiện hành và trạng thái thanh toán của đơn.",
          "Trường hợp cửa hàng nghỉ hoặc thay đổi cấu hình vận hành làm ảnh hưởng đến lịch đã đặt, hệ thống có thể yêu cầu xác nhận hủy và hoàn tiền cho khách hàng.",
        ],
      },
      {
        heading: "Điều 8: Đánh giá dịch vụ",
        items: [
          "Khách hàng có thể đánh giá sau khi lượt rửa xe hoàn tất.",
          "Nội dung đánh giá cần phản ánh trải nghiệm thực tế, không sử dụng ngôn từ xúc phạm, sai sự thật hoặc gây ảnh hưởng đến người khác.",
          "autoWash có quyền sử dụng phản hồi để cải thiện chất lượng dịch vụ, đào tạo nhân viên và tối ưu vận hành.",
        ],
      },
      {
        heading: "Điều 9: Tạm ngưng hoặc từ chối phục vụ",
        items: [
          "autoWash có quyền từ chối phục vụ khi phát hiện thông tin tài khoản, phương tiện, thanh toán hoặc voucher có dấu hiệu gian lận.",
          "Các hành vi sử dụng sai tài khoản, giả mạo biển số, lợi dụng voucher hoặc gây cản trở vận hành có thể dẫn đến khóa quyền sử dụng dịch vụ.",
          "Các tranh chấp phát sinh sẽ được ưu tiên giải quyết thông qua trao đổi trực tiếp trên cơ sở dữ liệu ghi nhận trong hệ thống.",
        ],
      },
    ],
  },
  privacy: {
    label: "Bảo mật",
    title: "Chính sách bảo mật thông tin autoWash",
    intro:
      "autoWash thu thập và xử lý dữ liệu cần thiết để vận hành đặt lịch, chăm sóc xe, thanh toán, tích điểm, hỗ trợ khách hàng và bảo vệ an toàn hệ thống.",
    sections: [
      {
        heading: "Điều 1: Thông tin được thu thập",
        items: [
          "Thông tin tài khoản gồm họ tên, số điện thoại, email, vai trò, trạng thái tài khoản và thông tin đăng nhập cần thiết.",
          "Thông tin phương tiện gồm biển số xe, hãng xe, mẫu xe, kích thước xe và trạng thái phương tiện.",
          "Thông tin đặt lịch gồm dịch vụ đã chọn, ngày giờ hẹn, trạng thái xử lý, ghi chú khách hàng, mã QR và lịch sử check-in.",
          "Thông tin thanh toán gồm phương thức thanh toán, trạng thái thanh toán, tổng tiền, số tiền giảm giá, ví và lịch sử giao dịch nếu có.",
          "Thông tin đánh giá gồm số sao, nội dung nhận xét và lựa chọn nhanh về chất lượng dịch vụ.",
        ],
      },
      {
        heading: "Điều 2: Mục đích sử dụng dữ liệu",
        items: [
          "Xác định khách hàng, phương tiện và quyền sử dụng dịch vụ.",
          "Tính giá, kiểm tra slot còn trống, tạo lịch, check-in, điều phối khoang rửa và cập nhật tiến độ.",
          "Xử lý thanh toán, hoàn tiền, ví, voucher, hạng thành viên và điểm thưởng.",
          "Hỗ trợ khách hàng khi có yêu cầu tra cứu lịch sử, hủy lịch, kiểm tra giao dịch hoặc cập nhật thông tin.",
          "Cải thiện chất lượng vận hành, trải nghiệm đặt lịch và chất lượng phục vụ.",
        ],
      },
      {
        heading: "Điều 3: Chia sẻ dữ liệu",
        items: [
          "autoWash không bán thông tin cá nhân của khách hàng cho bên thứ ba.",
          "Dữ liệu có thể được chia sẻ cho đơn vị thanh toán khi cần xử lý giao dịch PayOS hoặc các nghiệp vụ thanh toán liên quan.",
          "Dữ liệu có thể được cung cấp khi có yêu cầu hợp pháp từ cơ quan có thẩm quyền.",
        ],
      },
      {
        heading: "Điều 4: Bảo vệ tài khoản",
        items: [
          "Khách hàng có trách nhiệm bảo mật thông tin đăng nhập và thông báo cho autoWash khi phát hiện truy cập bất thường.",
          "autoWash có thể khóa hoặc hạn chế tài khoản khi phát hiện dấu hiệu gian lận, rủi ro bảo mật hoặc vi phạm điều khoản sử dụng.",
          "Mật khẩu, token đăng nhập và quyền truy cập được kiểm soát theo vai trò khách hàng, nhân viên và quản trị viên.",
        ],
      },
      {
        heading: "Điều 5: Cập nhật và hỗ trợ dữ liệu",
        items: [
          `Khách hàng có thể liên hệ ${contactPhone} để được hỗ trợ kiểm tra, điều chỉnh hoặc cập nhật thông tin cá nhân khi cần.`,
          "Một số dữ liệu giao dịch, lịch sử đặt lịch và thanh toán có thể được lưu giữ để phục vụ đối soát, chăm sóc khách hàng và tuân thủ nghĩa vụ pháp lý.",
        ],
      },
    ],
  },
};

export default function InfoPage({ page = "about" }) {
  const content = pages[page] || pages.about;

  return (
    <main className="flex min-h-screen flex-col bg-[#f7fbfd] text-slate-950">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-10 sm:px-8 lg:py-14">
        <Link
          to="/booking"
          className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-700 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-100"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Quay lại đặt lịch
        </Link>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-9">
          <header className="border-b border-slate-200 pb-7">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
              autoWash | {content.label}
            </p>
            <h1 className="max-w-4xl text-3xl font-black leading-tight sm:text-5xl">
              {content.title}
            </h1>
            <p className="mt-4 text-sm font-bold text-slate-500">
              Ngày có hiệu lực: {effectiveDate}
            </p>
            <p className="mt-5 max-w-4xl text-base font-semibold leading-8 text-slate-600">
              {content.intro}
            </p>
          </header>

          <div className="mt-8 space-y-8">
            {content.sections.map((section) => (
              <section key={section.heading} className="space-y-4">
                <h2 className="text-xl font-black text-slate-950">
                  {section.heading}
                </h2>
                <ol className="space-y-3 text-sm font-semibold leading-7 text-slate-600">
                  {section.items.map((item, index) => (
                    <li
                      key={item}
                      className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 border-l-2 border-cyan-100 pl-4"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-xs font-black text-cyan-700">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>

          <footer className="mt-10 border-t border-slate-200 pt-6 text-sm font-semibold leading-7 text-slate-500">
            <p className="font-black text-slate-900">Thông tin liên hệ</p>
            <p>autoWash - Hệ thống đặt lịch và vận hành dịch vụ rửa xe.</p>
            <p>Điện thoại hỗ trợ: {contactPhone}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
              Nội dung được xây dựng theo dữ liệu và nghiệp vụ hiện có của hệ thống autoWash.
            </p>
          </footer>
        </article>
      </div>
    </main>
  );
}
