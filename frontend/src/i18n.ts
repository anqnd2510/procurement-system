import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const vi = {
  Workspace: 'Không gian làm việc',
  Overview: 'Tổng quan',
  'Purchase requests': 'Yêu cầu mua hàng',
  'Purchase orders': 'Đơn đặt hàng',
  Inventory: 'Tồn kho',
  Products: 'Sản phẩm',
  Categories: 'Danh mục',
  Organization: 'Tổ chức',
  Manage: 'Quản lý',
  'No organization': 'Chưa có tổ chức',
  'Create a workspace': 'Tạo không gian làm việc',
  'Connected to your API': 'Đã kết nối API',
  'Live workspace data': 'Dữ liệu trực tiếp',
  'Collapse sidebar': 'Thu gọn thanh bên',
  'Select organization': 'Chọn tổ chức',
  'Active organization': 'Tổ chức hiện tại',
  'Sign out': 'Đăng xuất',
  'Procurement workspace': 'Không gian nghiệp vụ mua sắm',
  'Connected to the configured API': 'Đã kết nối API đã cấu hình',
  'Access restricted': 'Không có quyền truy cập',
  'Your organization role does not allow access to this page.':
    'Vai trò của bạn trong tổ chức không được phép truy cập trang này.',
  'Use an owner or manager account to open the audit trail.':
    'Dùng tài khoản Chủ sở hữu hoặc Quản lý để xem nhật ký kiểm toán.',
  'Change language': 'Đổi ngôn ngữ',
  'Switch to dark mode': 'Chuyển sang chế độ tối',
  'Switch to light mode': 'Chuyển sang chế độ sáng',
  Preferences: 'Tùy chọn',
  'Good morning': 'Chào buổi sáng',
  'Good afternoon': 'Chào buổi chiều',
  'Good evening': 'Chào buổi tối',
  there: 'bạn',
  'your workspace': 'không gian làm việc của bạn',
  'Here’s what is happening in {{organization}} today.':
    'Đây là tình hình hoạt động hôm nay tại {{organization}}.',
  'OPERATIONS · OVERVIEW': 'NGHIỆP VỤ · TỔNG QUAN',
  'Across all workflow stages': 'Ở tất cả các bước xử lý',
  'Awaiting review': 'Chờ phê duyệt',
  'Submitted for a decision': 'Đã gửi chờ quyết định',
  'Active products': 'Sản phẩm đang hoạt động',
  'Active products in this organization':
    'Sản phẩm đang hoạt động trong tổ chức',
  'Open purchase orders': 'Đơn đặt hàng đang mở',
  'Draft or issued orders': 'Đơn nháp hoặc đã phát hành',
  'Available stock': 'Tồn kho khả dụng',
  'Reserved stock': 'Tồn kho đã giữ',
  'Held by active workflows': 'Được giữ cho các quy trình đang xử lý',
  '{{count}} tracked products': 'Đang theo dõi {{count}} sản phẩm',
  'Request pipeline': 'Tiến độ yêu cầu',
  'Live organization aggregates from the dashboard API':
    'Số liệu tổng hợp trực tiếp từ API bảng điều khiển',
  'Recent requests': 'Yêu cầu gần đây',
  'Latest activity in this organization': 'Hoạt động mới nhất trong tổ chức',
  'View all': 'Xem tất cả',
  'New purchase request': 'Tạo yêu cầu mua hàng',
  'Set up organization': 'Thiết lập tổ chức',
  'Procurement starts with an organization.':
    'Bắt đầu quy trình mua sắm bằng cách tạo tổ chức.',
  'Create an organization to invite your team and begin routing requests.':
    'Tạo tổ chức để mời nhóm và bắt đầu xử lý yêu cầu mua hàng.',
  'FIRST, SET UP YOUR WORKSPACE': 'BẮT ĐẦU BẰNG THIẾT LẬP KHÔNG GIAN LÀM VIỆC',
  'Procurement API readiness': 'Trạng thái sẵn sàng của API mua sắm',
  'API readiness needs attention': 'API cần được kiểm tra',
  'The readiness endpoint could not confirm all dependencies.':
    'API trạng thái chưa xác nhận được tất cả dịch vụ phụ thuộc.',
  'Last checked': 'Kiểm tra lần cuối',
  'just now': 'vừa xong',
  'checking…': 'đang kiểm tra…',
  CHECKING: 'ĐANG KIỂM TRA',
  'CHECK REQUIRED': 'CẦN KIỂM TRA',
  'Counts are returned by the API; cancelled requests are omitted from the visual pipeline.':
    'Số liệu do API trả về; yêu cầu đã hủy được ẩn khỏi biểu đồ tiến độ.',
  'No purchase requests yet': 'Chưa có yêu cầu mua hàng',
  'Create the first request to start your organization’s approval workflow.':
    'Tạo yêu cầu đầu tiên để bắt đầu quy trình phê duyệt của tổ chức.',
  'Create a request': 'Tạo yêu cầu',
  'Common actions': 'Thao tác thường dùng',
  'Move work forward': 'Tiếp tục xử lý công việc',
  'Start a request': 'Tạo yêu cầu',
  'Draft items for approval': 'Lập danh sách chờ phê duyệt',
  'Review inventory': 'Kiểm tra tồn kho',
  'Check available quantities': 'Kiểm tra số lượng khả dụng',
  'Manage catalog': 'Quản lý danh mục',
  'Products and categories': 'Sản phẩm và danh mục',
  'Operational notes': 'Ghi chú vận hành',
  'What this workspace can currently report':
    'Các số liệu hiện có của hệ thống',
  'Request lifecycle': 'Vòng đời yêu cầu',
  'Draft, submit, approve, reject, cancel, and fulfill are available.':
    'Hỗ trợ tạo nháp, gửi, duyệt, từ chối, hủy và hoàn tất yêu cầu.',
  'Order register': 'Danh sách đơn đặt hàng',
  'Dashboard KPIs include live order totals and open-order counts.':
    'Chỉ số tổng hợp đơn hàng và số đơn đang mở được tải trực tiếp từ API.',
  'Inventory ledger': 'Sổ giao dịch tồn kho',
  'Stock movements and request-driven reservations are recorded in the inventory transaction history.':
    'Các lần nhập, giữ và xuất kho theo yêu cầu được ghi trong lịch sử giao dịch.',
  'Loading workspace data…': 'Đang tải dữ liệu không gian làm việc…',
  'We couldn’t load this data.': 'Không thể tải dữ liệu này.',
  'Try again': 'Thử lại',
  'Close dialog': 'Đóng hộp thoại',
  'WELCOME TO SUPPLYDESK': 'CHÀO MỪNG ĐẾN VỚI SUPPLYDESK',
  'PROCUREMENT WORKSPACE': 'KHÔNG GIAN NGHIỆP VỤ MUA SẮM',
  'Bring every purchase decision into focus.':
    'Theo dõi rõ ràng mọi quyết định mua sắm.',
  'A clear operating view across requests, inventory, and the teams behind every order.':
    'Theo dõi yêu cầu, tồn kho và các nhóm phụ trách từng đơn hàng trên một giao diện.',
  'Organization-scoped workspaces': 'Không gian làm việc theo tổ chức',
  'Traceable request approvals': 'Phê duyệt yêu cầu có thể truy vết',
  'Inventory-aware receiving': 'Nhập kho đồng bộ với tồn kho',
  'Built for the work behind the purchase.':
    'Thiết kế cho toàn bộ quy trình mua sắm nội bộ.',
  'Create your account': 'Tạo tài khoản',
  'Sign in to your workspace': 'Đăng nhập vào không gian làm việc',
  'Start with an employee account. You can create or join an organization after signing in.':
    'Bắt đầu bằng tài khoản nhân viên. Sau khi đăng nhập, bạn có thể tạo hoặc tham gia tổ chức.',
  'Enter your account details to continue to procurement operations.':
    'Nhập thông tin tài khoản để tiếp tục.',
  'Work email': 'Email công việc',
  Password: 'Mật khẩu',
  'Use at least 6 characters.': 'Sử dụng ít nhất 6 ký tự.',
  'Create account': 'Tạo tài khoản',
  'Already have an account?': 'Đã có tài khoản?',
  'New to this workspace?': 'Bạn mới sử dụng?',
  'Create an account': 'Tạo tài khoản',
  'Your credentials are sent only to the configured API.':
    'Thông tin đăng nhập chỉ được gửi đến API đã cấu hình.',
  'Hide password': 'Ẩn mật khẩu',
  'Show password': 'Hiện mật khẩu',
  'There is no inventory history for this product yet.':
    'Sản phẩm này chưa có lịch sử tồn kho.',
  'Stock-in is restricted to OWNER and MANAGER organization roles.':
    'Chỉ Chủ sở hữu và Quản lý của tổ chức được nhập kho.',
  'Check the balance and transaction history before retrying a stock-in.':
    'Hãy kiểm tra số dư và lịch sử giao dịch trước khi thử nhập kho lại.',
  'ACCESS CONTROL': 'KIỂM SOÁT TRUY CẬP',
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã gửi',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
  FULFILLED: 'Đã hoàn tất',
  ISSUED: 'Đã phát hành',
  RECEIVED: 'Đã nhận hàng',
  OWNER: 'Chủ sở hữu',
  MANAGER: 'Quản lý',
  MEMBER: 'Thành viên',
  'Audit endpoint access requires the OWNER or MANAGER organization role.':
    'API nhật ký kiểm toán yêu cầu vai trò Chủ sở hữu hoặc Quản lý.',
  'Main navigation': 'Điều hướng chính',
  'Sign in': 'Đăng nhập',
  'SECURE WORKSPACE': 'KHÔNG GIAN LÀM VIỆC AN TOÀN',
  'Product catalog': 'Danh mục sản phẩm',
  'Maintain the items your teams can request and your organization can receive.':
    'Quản lý sản phẩm nhân viên có thể yêu cầu và tổ chức có thể nhập kho.',
  'Catalog not available for this workspace':
    'Danh mục chưa khả dụng cho không gian làm việc này',
  'Current read endpoints are pinned to the default organization.':
    'API đọc hiện chỉ hỗ trợ tổ chức mặc định.',
  'No matching products': 'Không tìm thấy sản phẩm phù hợp',
  'No products in this catalog': 'Danh mục chưa có sản phẩm',
  'Try a different name, SKU, or category.':
    'Thử tên, mã SKU hoặc danh mục khác.',
  'Create a product to make it available for requests.':
    'Tạo sản phẩm để nhân viên có thể đưa vào yêu cầu mua hàng.',
  Uncategorized: 'Chưa phân loại',
  'No description provided': 'Chưa có mô tả',
  'Search current product page': 'Tìm trong trang sản phẩm hiện tại',
  'Search this page…': 'Tìm trong trang này…',
  'More product actions': 'Thao tác sản phẩm khác',
  'Actions are limited to supported API operations':
    'Chỉ có các thao tác được API hỗ trợ',
  'CATALOG · PRODUCTS': 'DANH MỤC · SẢN PHẨM',
  'Maintain catalog items available to your organization.':
    'Quản lý sản phẩm có thể sử dụng trong tổ chức.',
  'Search is limited to this page': 'Tìm kiếm chỉ áp dụng trên trang hiện tại',
  'Category structure': 'Cấu trúc danh mục',
  'Parent and child categories from the live catalog':
    'Danh mục cha và danh mục con từ dữ liệu hiện tại',
  'Categories unavailable': 'Danh mục chưa khả dụng',
  'Select the default catalog organization to browse categories.':
    'Chọn tổ chức danh mục mặc định để xem danh mục.',
  'No categories yet': 'Chưa có danh mục',
  'Create a root category, then add child categories as needed.':
    'Tạo danh mục gốc, sau đó thêm danh mục con nếu cần.',
  'Category name': 'Tên danh mục',
  'Parent category': 'Danh mục cha',
  'Leave empty to create a root category.':
    'Để trống nếu muốn tạo danh mục gốc.',
  Description: 'Mô tả',
  'No parent': 'Không có danh mục cha',
  'Edit category': 'Chỉnh sửa danh mục',
  'Create category': 'Tạo danh mục',
  'Save changes': 'Lưu thay đổi',
  Subcategory: 'Danh mục con',
  'Root category': 'Danh mục gốc',
  'Add child category': 'Thêm danh mục con',
  'Organize products into a hierarchy your teams can browse and request.':
    'Sắp xếp sản phẩm theo cấu trúc để các nhóm dễ tìm và yêu cầu.',
  'including immediate child categories returned by the API':
    'bao gồm danh mục con trực tiếp do API trả về',
  'HIERARCHY VIEW': 'CẤU TRÚC PHÂN CẤP',
  'Your organizations': 'Tổ chức của bạn',
  'You can switch workspaces from the top navigation as well.':
    'Bạn cũng có thể đổi không gian làm việc ở thanh điều hướng phía trên.',
  'Workspace profile': 'Thông tin tổ chức',
  'Create your first organization': 'Tạo tổ chức đầu tiên',
  'Identity and current membership': 'Thông tin và quyền thành viên hiện tại',
  'Organizations are the security boundary for procurement data.':
    'Tổ chức là ranh giới bảo mật cho dữ liệu mua sắm.',
  'ACTIVE ORGANIZATION': 'TỔ CHỨC ĐANG CHỌN',
  'Organization ID': 'Mã tổ chức',
  'Your access': 'Quyền truy cập',
  Created: 'Ngày tạo',
  'No organization membership': 'Bạn chưa thuộc tổ chức nào',
  'Create an organization to become its owner, then add existing users and departments.':
    'Tạo tổ chức để trở thành chủ sở hữu, sau đó thêm người dùng và phòng ban.',
  'Organization name': 'Tên tổ chức',
  'URL slug': 'Định danh URL',
  'Lowercase letters, numbers, and hyphens.':
    'Dùng chữ thường, chữ số và dấu gạch nối.',
  Departments: 'Phòng ban',
  'Choose an organization first': 'Hãy chọn tổ chức trước',
  'Departments are scoped to an organization.':
    'Phòng ban thuộc phạm vi của một tổ chức.',
  'No departments yet': 'Chưa có phòng ban',
  'Add a department so requests can be routed to a team.':
    'Thêm phòng ban để chuyển yêu cầu đến đúng nhóm.',
  'Department name': 'Tên phòng ban',
  Code: 'Mã',
  'Organization members': 'Thành viên tổ chức',
  'No active organization': 'Chưa chọn tổ chức',
  'Create or select a workspace to view its members.':
    'Tạo hoặc chọn không gian làm việc để xem thành viên.',
  'No members returned': 'Không có thành viên',
  'The membership list will appear here when available.':
    'Danh sách thành viên sẽ hiển thị tại đây khi có dữ liệu.',
  'Unknown user': 'Người dùng không xác định',
  'Invite an existing account': 'Mời tài khoản hiện có',
  'Member removal and role changes do not have backend endpoints yet.':
    'API hiện chưa hỗ trợ xóa thành viên hoặc đổi vai trò.',
  'you become OWNER': 'bạn sẽ là CHỦ SỞ HỮU',
  'Manage workspaces, membership, and the departments used to route purchase requests.':
    'Quản lý tổ chức, thành viên và phòng ban dùng để phân luồng yêu cầu mua hàng.',
  'Audit trail': 'Nhật ký kiểm toán',
  'Review important procurement and inventory changes recorded by the backend.':
    'Theo dõi các thay đổi mua sắm và tồn kho được backend ghi nhận.',
  'Append-only operational record': 'Nhật ký vận hành chỉ ghi nối tiếp',
  'ORGANIZATION SCOPED': 'GIỚI HẠN THEO TỔ CHỨC',
  'Recorded events': 'Sự kiện đã ghi nhận',
  'Filter events': 'Lọc sự kiện',
  Action: 'Thao tác',
  'Resource type': 'Loại tài nguyên',
  'Resource ID': 'Mã tài nguyên',
  'Audit access is restricted': 'Nhật ký kiểm toán bị giới hạn quyền truy cập',
  'Only organization owners and managers can inspect system audit events.':
    'Chỉ chủ sở hữu và quản lý tổ chức được xem sự kiện kiểm toán.',
  'No audit events match': 'Không có sự kiện phù hợp',
  'Try clearing filters, or perform a supported procurement operation to create an event.':
    'Thử xóa bộ lọc hoặc thực hiện thao tác mua sắm để tạo sự kiện mới.',
  'Event metadata': 'Thông tin sự kiện',
  'No inventory record yet': 'Chưa có bản ghi tồn kho',
  'Stock-in can initialize this product’s inventory record.':
    'Nhập kho sẽ tạo bản ghi tồn kho cho sản phẩm này.',
  'Refresh inventory': 'Làm mới tồn kho',
  Available: 'Khả dụng',
  Reserved: 'Đã giữ',
  'Total on hand': 'Tổng tồn kho',
  'Last updated': 'Cập nhật lần cuối',
  'Balance and ledger update atomically':
    'Số dư và sổ giao dịch được cập nhật nguyên tử',
  'Current balance': 'Số dư hiện tại',
  'Available, reserved, and total quantities':
    'Số lượng khả dụng, đã giữ và tổng cộng',
  'Manual stock-in': 'Nhập kho thủ công',
  'Organization manager workflow': 'Quy trình dành cho quản lý tổ chức',
  'Transaction history': 'Lịch sử giao dịch',
  'Paginated history is available from the inventory API':
    'API tồn kho cung cấp lịch sử có phân trang',
  'Reorder threshold': 'Ngưỡng đặt hàng lại',
  'No threshold exists in the current product/inventory schema':
    'Lược đồ sản phẩm/tồn kho hiện chưa có ngưỡng đặt hàng lại',
  AVAILABLE: 'ĐANG CÓ',
  'API GAP': 'CHƯA CÓ API',
  ACTIVITY: 'HOẠT ĐỘNG',
  QUANTITY: 'SỐ LƯỢNG',
  REFERENCE: 'MÃ THAM CHIẾU',
  RECORDED: 'THỜI GIAN',
  'Manual entry': 'Nhập thủ công',
  'Showing {{shown}} of {{total}} ledger events':
    'Đang hiển thị {{shown}} trên {{total}} giao dịch',
  'No inventory movements yet': 'Chưa có giao dịch tồn kho',
  'Stock events will appear here when stock is received or a purchase request changes inventory.':
    'Giao dịch sẽ xuất hiện khi nhập hàng hoặc yêu cầu mua hàng làm thay đổi tồn kho.',
  'Incoming stock recorded': 'Đã ghi nhận hàng nhập kho',
  'Stock held for a request': 'Đã giữ hàng cho yêu cầu',
  'Reserved stock returned': 'Đã hoàn lại hàng giữ',
  'Reserved stock fulfilled': 'Đã xuất hàng đã giữ',
  'Create, review, and move procurement requests through their organization’s approval lifecycle.':
    'Tạo, xem xét và xử lý yêu cầu mua hàng theo quy trình phê duyệt của tổ chức.',
  'All requests': 'Tất cả yêu cầu',
  Status: 'Trạng thái',
  'All statuses': 'Tất cả trạng thái',
  'LIVE DATA': 'DỮ LIỆU TRỰC TIẾP',
  REQUEST: 'YÊU CẦU',
  REQUESTER: 'NGƯỜI YÊU CẦU',
  DEPARTMENT: 'PHÒNG BAN',
  'ESTIMATED TOTAL': 'TỔNG ƯỚC TÍNH',
  STATUS: 'TRẠNG THÁI',
  'Requests are scoped to the active organization; create one to start the workflow.':
    'Yêu cầu thuộc tổ chức hiện tại; hãy tạo yêu cầu để bắt đầu quy trình.',
  'Create or join an organization before working with purchase requests.':
    'Tạo hoặc tham gia tổ chức trước khi tạo yêu cầu mua hàng.',
  'This workspace has no departments yet. Create one in Organization settings before submitting a request.':
    'Không gian này chưa có phòng ban. Hãy tạo phòng ban trong phần Tổ chức trước khi gửi yêu cầu.',
  'Product selection is unavailable for this organization because the catalog read API is pinned to the default workspace. You can still enter free-form request items.':
    'Không thể chọn sản phẩm vì API danh mục chỉ hỗ trợ tổ chức mặc định. Bạn vẫn có thể nhập mặt hàng thủ công.',
  'No business justification provided.': 'Chưa có lý do nghiệp vụ.',
  'Client estimate preview': 'Ước tính tạm tính',
  'Final total is calculated and returned by the server.':
    'Tổng cuối cùng do máy chủ tính toán và trả về.',
  'SERVER TOTAL': 'TỔNG TỪ MÁY CHỦ',
  'Requested items': 'Mặt hàng được yêu cầu',
  'Status history': 'Lịch sử trạng thái',
  'Line items': 'Các mặt hàng',
  'Totals are calculated by the API from quantity and estimated unit price.':
    'API tính tổng dựa trên số lượng và đơn giá ước tính.',
  'Select department…': 'Chọn phòng ban…',
  'Custom item': 'Mặt hàng tùy chỉnh',
  'Approved requests': 'Yêu cầu đã duyệt',
  'Nothing is ready to order': 'Chưa có yêu cầu sẵn sàng đặt hàng',
  'An organization manager can create purchase orders once requests are approved.':
    'Quản lý tổ chức có thể tạo đơn đặt hàng khi yêu cầu được duyệt.',
  'Create from request': 'Tạo từ yêu cầu',
  'Find a purchase order': 'Tìm đơn đặt hàng',
  'Retrieve one order by its server-issued UUID':
    'Tìm đơn hàng bằng UUID do máy chủ cấp',
  'Purchase order ID': 'Mã đơn đặt hàng',
  'Paste a purchase order ID': 'Dán mã đơn đặt hàng',
  'Opened in this browser': 'Đã mở trong trình duyệt này',
  'session history': 'lịch sử phiên',
  'Purchase order details': 'Chi tiết đơn đặt hàng',
  'Live detail from the selected organization':
    'Dữ liệu trực tiếp từ tổ chức đã chọn',
  'Loading purchase order…': 'Đang tải đơn đặt hàng…',
  'ORDER TOTAL': 'TỔNG ĐƠN HÀNG',
  'CREATED BY': 'NGƯỜI TẠO',
  'LINKED REQUEST': 'YÊU CẦU LIÊN KẾT',
  'Order lines': 'Các mặt hàng trong đơn',
  'Create purchase order': 'Tạo đơn đặt hàng',
  'Approved purchase request': 'Yêu cầu mua hàng đã duyệt',
  'Choose an approved request…': 'Chọn yêu cầu đã duyệt…',
  'The order lines and totals are copied from the approved request by the server.':
    'Máy chủ sao chép mặt hàng và tổng tiền từ yêu cầu đã duyệt.',
  'Supplier name': 'Tên nhà cung cấp',
  'Issue to supplier': 'Gửi nhà cung cấp',
  'Receive into inventory': 'Nhận hàng vào tồn kho',
  'Cancel order': 'Hủy đơn hàng',
  'Convert approved requests into supplier orders and record receipt into inventory.':
    'Chuyển yêu cầu đã duyệt thành đơn đặt hàng và ghi nhận hàng nhận vào tồn kho.',
  'Review available and reserved stock, then record incoming quantities.':
    'Kiểm tra hàng khả dụng và đã giữ, sau đó ghi nhận số lượng nhập.',
  'Current authoritative balance returned by the inventory API':
    'Số dư chuẩn hiện tại do API tồn kho trả về',
  'Adds quantity to available inventory in a backend transaction':
    'Cộng số lượng khả dụng trong một giao dịch backend',
  'A paginated ledger of stock-in, reservations, releases, and fulfillment events. Quantities are event amounts, not signed balance deltas.':
    'Sổ phân trang gồm nhập kho, giữ hàng, hoàn giữ và xuất hàng. Số lượng là giá trị sự kiện, không phải biến động có dấu của số dư.',
  'Movement type': 'Loại biến động',
  'All movements': 'Tất cả biến động',
  'Stock-in': 'Nhập kho',
  Reserve: 'Giữ hàng',
  Release: 'Hoàn giữ',
  Fulfill: 'Xuất hàng',
  'An append-only log of important actions':
    'Nhật ký nối tiếp các thao tác quan trọng',
  'Supplier orders': 'Đơn hàng nhà cung cấp',
  'Search by name, SKU, or category': 'Tìm theo tên, SKU hoặc danh mục',
  'Catalog size': 'Quy mô danh mục',
  'Product categories': 'Danh mục sản phẩm',
  'API-connected catalog': 'Danh mục kết nối API',
  'SKU, category, and list price': 'SKU, danh mục và giá niêm yết',
  PRODUCT: 'SẢN PHẨM',
  SKU: 'SKU',
  CATEGORY: 'DANH MỤC',
  'UNIT PRICE': 'ĐƠN GIÁ',
  UPDATED: 'CẬP NHẬT',
  'CATALOG SIZE': 'QUY MÔ DANH MỤC',
  'PRODUCT CATEGORIES': 'DANH MỤC SẢN PHẨM',
  'Edit product': 'Chỉnh sửa sản phẩm',
  'Add product': 'Thêm sản phẩm',
  'Product name': 'Tên sản phẩm',
  'Leave blank to let the API generate one.': 'Để trống để API tự tạo mã.',
  'Unit price (USD)': 'Đơn giá (USD)',
  'No category': 'Không có danh mục',
  'Category changes require the OWNER or MANAGER organization role.':
    'Thay đổi danh mục yêu cầu vai trò CHỦ SỞ HỮU hoặc QUẢN LÝ.',
  'Catalog changes require the OWNER or MANAGER organization role.':
    'Thay đổi danh mục sản phẩm yêu cầu vai trò CHỦ SỞ HỮU hoặc QUẢN LÝ.',
  'An organization manager can create and maintain catalog products.':
    'Quản lý tổ chức có thể tạo và cập nhật sản phẩm trong danh mục.',
  'The audit endpoint requires the OWNER or MANAGER organization role.':
    'API nhật ký kiểm toán yêu cầu vai trò CHỦ SỞ HỮU hoặc QUẢN LÝ.',
  'Provide a reason for rejecting this request:':
    'Nhập lý do từ chối yêu cầu này:',
  'Approval comment (optional):': 'Nhận xét phê duyệt (không bắt buộc):',
  'Cancel this purchase request?': 'Hủy yêu cầu mua hàng này?',
  'Fulfill this request and consume its reserved stock?':
    'Hoàn tất yêu cầu này và xuất số hàng đã giữ?',
  '{{count}} total · ordered by most recent':
    'Tổng {{count}} · sắp xếp theo mới nhất',
  'No {{status}} requests': 'Không có yêu cầu {{status}}',
  '{{count}} line item': '{{count}} mặt hàng',
  '{{count}} line items': '{{count}} mặt hàng',
  'Page {{page}} of {{totalPages}} · {{total}} records':
    'Trang {{page}}/{{totalPages}} · {{total}} bản ghi',
  'Created as {{status}}': 'Được tạo với trạng thái {{status}}',
  CREATED: 'NGÀY TẠO',
  'Inventory is retrieved by product ID from the API.':
    'Tồn kho được truy vấn từ API theo mã sản phẩm.',
  'This API version does not yet expose organization-scoped inventory search.':
    'Phiên bản API này chưa hỗ trợ tìm tồn kho theo tổ chức.',
  'Loading catalog…': 'Đang tải danh mục…',
  'Choose a product…': 'Chọn sản phẩm…',
  'Showing the first {{shown}} of {{total}} products. Use the Products page to navigate the full catalog.':
    'Đang hiển thị {{shown}}/{{total}} sản phẩm đầu tiên. Mở trang Sản phẩm để xem toàn bộ danh mục.',
  'Choose a product to inspect stock': 'Chọn sản phẩm để kiểm tra tồn kho',
  'Select from the catalog to load its current inventory balance.':
    'Chọn sản phẩm trong danh mục để tải số dư tồn kho hiện tại.',
  'Retrieving stock position…': 'Đang tải tình trạng tồn kho…',
  'Loading inventory history…': 'Đang tải lịch sử tồn kho…',
  'Purchase request details': 'Chi tiết yêu cầu mua hàng',
  'Loading request and status history…':
    'Đang tải yêu cầu và lịch sử trạng thái…',
  'Edit draft request': 'Chỉnh sửa yêu cầu nháp',
  'Create purchase request': 'Tạo yêu cầu mua hàng',
  'Request title': 'Tiêu đề yêu cầu',
  Department: 'Phòng ban',
  'Business justification': 'Lý do nghiệp vụ',
  'Catalog product (optional)': 'Sản phẩm trong danh mục (không bắt buộc)',
  'Item or service': 'Sản phẩm hoặc dịch vụ',
  Qty: 'SL',
  'Est. unit price': 'Đơn giá ước tính',
  'Line notes': 'Ghi chú mặt hàng',
  'New request': 'Yêu cầu mới',
  'Create request': 'Tạo yêu cầu',
  'Create draft request': 'Tạo yêu cầu nháp',
  'Submit for review': 'Gửi phê duyệt',
  'Cancel request': 'Hủy yêu cầu',
  'Edit draft': 'Sửa bản nháp',
  Approve: 'Phê duyệt',
  Reject: 'Từ chối',
  'Fulfill request': 'Hoàn tất yêu cầu',
  'Add item': 'Thêm mặt hàng',
  'Save draft': 'Lưu bản nháp',
  Cancel: 'Hủy',
  Previous: 'Trước',
  Next: 'Tiếp',
  'Create PO': 'Tạo đơn hàng',
  'Issue this purchase order to the supplier?':
    'Phát hành đơn đặt hàng này cho nhà cung cấp?',
  'Receive this order? This will add its quantities to inventory.':
    'Nhận đơn hàng này? Số lượng sẽ được cộng vào tồn kho.',
  'Cancel this purchase order?': 'Hủy đơn đặt hàng này?',
  'Member removal and role changes do not have backend endpoints yet':
    'API hiện chưa hỗ trợ xóa thành viên hoặc đổi vai trò',
  'Stock-in is restricted to OWNER and MANAGER organization roles. You can still review stock levels.':
    'Chỉ CHỦ SỞ HỮU và QUẢN LÝ mới được nhập kho. Bạn vẫn có thể xem mức tồn kho.',
  'The current inventory lookup is tied to the default catalog organization. Choose':
    'Tra cứu tồn kho hiện gắn với tổ chức danh mục mặc định. Hãy chọn',
  'to view products and inventory without crossing organization boundaries.':
    'để xem sản phẩm và tồn kho mà không vượt qua ranh giới tổ chức.',
  'If a request times out, check the current balance and movement history before recording the same receipt again.':
    'Nếu yêu cầu hết thời gian chờ, hãy kiểm tra số dư và lịch sử trước khi ghi nhận lại cùng một lần nhập.',
  'Last updated {{date}}': 'Cập nhật lần cuối {{date}}',
  'Page {{page}} of {{totalPages}}': 'Trang {{page}}/{{totalPages}}',
  'Page {{page}} of {{totalPages}} · newest first':
    'Trang {{page}}/{{totalPages}} · mới nhất trước',
  'Audit events are stored in the same database transaction as the business change.':
    'Sự kiện kiểm toán được lưu trong cùng giao dịch cơ sở dữ liệu với thay đổi nghiệp vụ.',
  'Select an organization to load its audit trail.':
    'Chọn tổ chức để tải nhật ký kiểm toán.',
  'The current API reads catalog data from the default acme-procurement organization. Product operations are paused here so writes cannot disappear from this view. Select that workspace or extend the backend’s catalog read endpoints for tenant-aware access.':
    'API hiện đọc danh mục từ tổ chức acme-procurement mặc định. Thao tác sản phẩm đang tạm khóa để dữ liệu không bị ghi vào nơi khác. Hãy chọn tổ chức đó hoặc mở rộng API backend để đọc theo từng tổ chức.',
  'soft-deleted records are hidden': 'bản ghi đã xóa mềm được ẩn',
  products: 'sản phẩm',
  groups: 'nhóm',
  Actions: 'Thao tác',
  of: 'trên',
  'ACCOUNT ROLE': 'VAI TRÒ TÀI KHOẢN',
  'ORGANIZATION ACCESS': 'QUYỀN TRONG TỔ CHỨC',
  JOINED: 'NGÀY THAM GIA',
  'Created “{{name}}” and switched the active workspace.':
    'Đã tạo “{{name}}” và chuyển sang không gian làm việc đó.',
  'Create another organization': 'Tạo thêm tổ chức',
  'Add a department': 'Thêm phòng ban',
  'Users must register before being added to an organization.':
    'Người dùng cần đăng ký trước khi được thêm vào tổ chức.',
  Member: 'Thành viên',
  'Showing the first {{count}} approved requests; paginate for larger workspaces.':
    'Đang hiển thị {{count}} yêu cầu đã duyệt đầu tiên; hãy phân trang khi tổ chức có nhiều dữ liệu.',
  '{{count}} items': '{{count}} mặt hàng',
  'Edit {{name}}': 'Sửa {{name}}',
  'Delete {{name}}': 'Xóa {{name}}',
  'Soft-delete {{name}}? It will be hidden from the active catalog.':
    'Xóa mềm {{name}}? Sản phẩm sẽ bị ẩn khỏi danh mục hiện tại.',
  'e.g. PURCHASE_ORDER_RECEIVED': 'vd. PURCHASE_ORDER_RECEIVED',
  'Select a product': 'Chọn sản phẩm',
  'Stock position': 'Tình trạng tồn kho',
  'Receive stock': 'Nhập kho',
  'Inventory coverage': 'Phạm vi tính năng tồn kho',
  'Inventory transaction history': 'Lịch sử giao dịch tồn kho',
  'Current backend capabilities': 'Tính năng backend hiện có',
  Product: 'Sản phẩm',
  'Quantity received': 'Số lượng nhập',
  'e.g. 24': 'vd. 24',
  'Record stock-in': 'Ghi nhận nhập kho',
  'The current Categories read API is pinned to the default':
    'API đọc danh mục hiện chỉ hỗ trợ tổ chức mặc định',
  'organization. Category operations are paused for other organizations.':
    'Các thao tác danh mục đang tạm khóa với tổ chức khác.',
  '{{count}} categories': '{{count}} danh mục',
  'New category': 'Danh mục mới',
  'The current API reads catalog data from the default':
    'API hiện đọc dữ liệu danh mục từ tổ chức mặc định',
  'organization. Product operations are paused here so writes cannot disappear from this view. Select that workspace or extend the backend’s catalog read endpoints for tenant-aware access.':
    'Các thao tác sản phẩm được tạm khóa để dữ liệu không bị ghi vào nơi khác. Hãy chọn tổ chức đó hoặc mở rộng API backend để hỗ trợ đọc danh mục theo tổ chức.',
  Clear: 'Xóa bộ lọc',
};

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: {} },
    vi: { translation: vi },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export { i18n };
