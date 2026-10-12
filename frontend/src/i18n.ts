import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const vi = {
  'Dismiss notification': 'Đóng thông báo',
  'Keep it': 'Quay lại',
  Continue: 'Tiếp tục',
  'Product updated.': 'Đã cập nhật sản phẩm.',
  'Product added.': 'Đã thêm sản phẩm.',
  'Product hidden from the catalog.': 'Đã ẩn sản phẩm khỏi danh mục.',
  'Category updated.': 'Đã cập nhật danh mục.',
  'Category created.': 'Đã tạo danh mục.',
  'Category removed.': 'Đã xóa danh mục.',
  'Purchase request updated.': 'Đã cập nhật yêu cầu mua hàng.',
  'Purchase request created.': 'Đã tạo yêu cầu mua hàng.',
  'Purchase order created.': 'Đã tạo đơn đặt hàng.',
  'Purchase order updated.': 'Đã cập nhật đơn đặt hàng.',
  'Stock receipt recorded.': 'Đã ghi nhận hàng nhập kho.',
  'Restock settings saved.': 'Đã lưu thiết lập nhắc nhập hàng.',
  'Organization created.': 'Đã tạo tổ chức.',
  'Member added to the organization.': 'Đã thêm thành viên vào tổ chức.',
  'Department created.': 'Đã tạo phòng ban.',
  'Department updated.': 'Đã cập nhật phòng ban.',
  'Department assignment updated.': 'Đã cập nhật phân công phòng ban.',
  'Hide product?': 'Ẩn sản phẩm?',
  'Hide product': 'Ẩn sản phẩm',
  'Remove category?': 'Xóa danh mục?',
  'Remove category': 'Xóa danh mục',
  'Hide category?': 'Ẩn danh mục?',
  'Hide category': 'Ẩn danh mục',
  'Cancel purchase order?': 'Hủy đơn đặt hàng?',
  'Receive purchase order?': 'Nhận hàng theo đơn?',
  'Send purchase order?': 'Gửi đơn đặt hàng?',
  'Record receipt': 'Ghi nhận hàng đã nhận',
  'Send to supplier': 'Gửi nhà cung cấp',
  'Cancel purchase request?': 'Hủy yêu cầu mua hàng?',
  'Complete this request?': 'Hoàn tất yêu cầu này?',
  Complete: 'Hoàn tất',
  'Activity history': 'Lịch sử hoạt động',
  'Changes made in this organization.': 'Các thay đổi trong tổ chức này.',
  'Related item': 'Mục liên quan',
  'Alert below: {{quantity}} items': 'Cảnh báo khi còn {{quantity}} sản phẩm',
  'Restock up to: {{quantity}} items': 'Bổ sung hàng đến {{quantity}} sản phẩm',
  '{{quantity}} items received': 'Đã nhập {{quantity}} sản phẩm',
  'Total: {{amount}}': 'Tổng tiền: {{amount}}',
  'Request details updated.': 'Thông tin yêu cầu đã được cập nhật.',
  'Try adjusting the filters.': 'Thử thay đổi bộ lọc.',
  'Ask an organization owner or manager for access.':
    'Liên hệ chủ sở hữu hoặc quản lý tổ chức để được cấp quyền.',
  'This page is not available': 'Bạn chưa thể truy cập trang này',
  'Recent activity': 'Hoạt động gần đây',
  '{{count}} recorded activities': '{{count}} hoạt động đã ghi nhận',
  'All activity types': 'Tất cả loại hoạt động',
  'No activity found': 'Chưa có hoạt động phù hợp',
  Activity: 'Hoạt động',
  SOURCE: 'NGUỒN',
  'Purchase request or order': 'Yêu cầu hoặc đơn đặt hàng',
  'Direct stock entry': 'Nhập hàng trực tiếp',
  'Restock settings': 'Thiết lập nhắc nhập hàng',
  'Choose when to be reminded and how much stock to keep.':
    'Chọn mức hàng cần nhắc và số lượng nên duy trì.',
  'Low-stock reminders are on for this product.':
    'Đã bật nhắc khi sản phẩm sắp hết hàng.',
  'No low-stock reminder has been set for this product.':
    'Chưa thiết lập nhắc khi sản phẩm sắp hết hàng.',
  'Remind me when stock reaches': 'Nhắc tôi khi hàng còn',
  'A reminder appears when available stock reaches this amount.':
    'Hiển thị nhắc nhở khi số lượng hàng còn ở mức này.',
  'Stock level after restocking': 'Số lượng sau khi nhập thêm',
  'The suggested amount to order is based on this level.':
    'Số lượng cần đặt thêm được tính theo mức này.',
  'On-order quantity includes orders already sent to suppliers; drafts are not counted.':
    'Chỉ tính đơn đã gửi nhà cung cấp; đơn nháp chưa được tính.',
  'Turn off reminders': 'Tắt nhắc nhở',
  'Save restock settings': 'Lưu thiết lập',
  'Restock reminders': 'Nhắc nhập hàng',
  'Products that have reached their low-stock reminder level.':
    'Sản phẩm đã chạm mức cần nhắc nhập thêm.',
  'Search restock reminders': 'Tìm sản phẩm cần nhập thêm',
  'Stock level': 'Tình trạng hàng',
  'All reminders': 'Tất cả nhắc nhở',
  'Loading restock reminders…': 'Đang tải danh sách cần nhập thêm…',
  'No restock reminders': 'Chưa có sản phẩm cần nhập thêm',
  'Products will appear here when stock reaches the reminder level.':
    'Sản phẩm sẽ xuất hiện ở đây khi lượng hàng chạm mức nhắc.',
  'The restocked level must be higher than the reminder level.':
    'Số lượng sau khi nhập thêm phải cao hơn mức nhắc.',
  STOCK_IN: 'Đã nhập hàng',
  RESERVE: 'Đã giữ cho yêu cầu',
  RELEASE: 'Đã trả lại kho',
  FULFILL: 'Đã xuất theo yêu cầu',
  'No stock has been recorded for this product yet.':
    'Sản phẩm này chưa có hàng trong kho.',
  'ACTIVITY · CHANGES': 'HOẠT ĐỘNG · THAY ĐỔI',
  'CATALOG · GROUPS': 'DANH MỤC · NHÓM SẢN PHẨM',
  'Select an organization to view its activity history.':
    'Chọn tổ chức để xem lịch sử hoạt động.',
  'Additional details': 'Thông tin bổ sung',
  'A history of important changes in this organization.':
    'Lịch sử ghi lại các thay đổi quan trọng trong tổ chức này.',
  'Activity type': 'Loại hoạt động',
  'Activity code': 'Mã hoạt động',
  'This feature is not available in this workspace yet.':
    'Tính năng này hiện chưa có trong không gian làm việc.',
  'We could not complete this request. Please try again later.':
    'Chưa thể thực hiện thao tác này. Vui lòng thử lại sau.',
  'Unable to connect. Check your connection and try again.':
    'Không thể kết nối. Hãy kiểm tra mạng rồi thử lại.',
  'Requests belong to the current organization. Create one to get started.':
    'Yêu cầu thuộc tổ chức hiện tại. Hãy tạo yêu cầu để bắt đầu.',
  'Departments belong to this organization.':
    'Các phòng ban thuộc tổ chức này.',
  'Estimated total': 'Tổng tiền ước tính',
  'Current product catalog': 'Danh mục sản phẩm hiện tại',
  'Hidden products are not shown': 'Sản phẩm đã ẩn sẽ không hiển thị',
  'Product code, category, and price': 'Mã sản phẩm, danh mục và giá',
  'Remove {{name}}? Categories with active products cannot be removed.':
    'Xóa {{name}}? Không thể xóa danh mục đang có sản phẩm.',
  'Search by product name or code…': 'Tìm theo tên hoặc mã sản phẩm…',
  'Try another product name or code, or use a custom item.':
    'Thử tên hoặc mã sản phẩm khác, hoặc dùng mặt hàng tùy chỉnh.',
  'Try a different product name or code.': 'Thử tên hoặc mã sản phẩm khác.',
  'Product code': 'Mã sản phẩm',
  'Leave blank to create a code automatically.':
    'Để trống để hệ thống tự tạo mã.',
  'Hide {{name}} from the catalog?': 'Ẩn {{name}} khỏi danh mục?',
  'Only currently available actions are shown.':
    'Chỉ hiển thị thao tác hiện có.',
  'Choose a product to view its stock level.':
    'Chọn sản phẩm để xem số lượng tồn.',
  'Current stock levels for the selected product.':
    'Số lượng tồn hiện tại của sản phẩm đã chọn.',
  'Record newly received items and update the available quantity.':
    'Ghi nhận hàng mới nhập và cập nhật số lượng hiện có.',
  'Stock levels and activity history are updated together.':
    'Số lượng tồn và lịch sử hoạt động được cập nhật cùng lúc.',
  'Available inventory features': 'Các tính năng quản lý tồn kho hiện có',
  'Browse stock activity by page.': 'Xem hoạt động tồn kho theo từng trang.',
  'Stock activity': 'Hoạt động tồn kho',
  'Review received stock and changes made while handling purchase requests.':
    'Xem hàng đã nhập và các thay đổi phát sinh khi xử lý yêu cầu mua hàng.',
  'Linked activity': 'Hoạt động liên quan',
  'Removing members or changing their roles is not available yet.':
    'Hiện chưa thể xóa thành viên hoặc thay đổi vai trò.',
  '{{count}} members in this organization':
    '{{count}} thành viên trong tổ chức này',
  'Some services need attention': 'Một số dịch vụ cần được kiểm tra',
  'Service status': 'Tình trạng dịch vụ',
  'We could not confirm that all services are working.':
    'Chưa thể xác nhận tất cả dịch vụ đang hoạt động bình thường.',
  'Current activity in this organization': 'Hoạt động hiện tại trong tổ chức',
  'Cancelled requests are not included in this overview.':
    'Yêu cầu đã hủy không được tính trong phần tổng quan này.',
  'Review important changes to purchase requests, orders, and stock.':
    'Theo dõi các thay đổi quan trọng về yêu cầu mua hàng, đơn đặt hàng và tồn kho.',
  'Only organization owners and managers can view this activity history.':
    'Chỉ chủ sở hữu và quản lý tổ chức mới có thể xem lịch sử hoạt động này.',
  'Each activity entry is saved along with the action it describes.':
    'Mỗi mục lịch sử được lưu cùng với thao tác tương ứng.',
  'Activity ID': 'Mã hoạt động',
  'This history includes purchase requests, purchase orders, and stock received manually. Other changes may not appear here.':
    'Lịch sử này gồm yêu cầu mua hàng, đơn đặt hàng và hàng nhập kho thủ công. Một số thay đổi khác có thể không xuất hiện ở đây.',
  'Your sign-in details are only used to access this workspace.':
    'Thông tin đăng nhập chỉ được dùng để truy cập không gian làm việc này.',
  'Enter an order number to find it.': 'Nhập mã đơn hàng để tìm.',
  'Order reference': 'Mã tham chiếu đơn hàng',
  'Paste an order reference': 'Nhập mã tham chiếu đơn hàng',
  'Items and total are carried over from the approved request.':
    'Mặt hàng và tổng tiền được lấy từ yêu cầu đã duyệt.',
  'The total is calculated from quantity and estimated unit price.':
    'Tổng tiền được tính từ số lượng và đơn giá ước tính.',
  'The final total is calculated automatically.':
    'Tổng tiền cuối cùng được tính tự động.',
  'FINAL TOTAL': 'TỔNG TIỀN CUỐI CÙNG',
  'including their direct subcategories': 'bao gồm các danh mục con trực tiếp',
  'Workspace ready': 'Không gian làm việc đã sẵn sàng',
  'Connected to your workspace': 'Đã kết nối không gian làm việc',
  'Clear search': 'Xóa tìm kiếm',
  Pagination: 'Điều hướng trang',
  'Previous page': 'Trang trước',
  'Next page': 'Trang sau',
  'Page {{page}}': 'Trang {{page}}',
  'Showing {{from}}–{{to}} of {{total}} records':
    'Hiển thị {{from}}–{{to}} / {{total}} bản ghi',
  'All actions': 'Tất cả hành động',
  'All resource types': 'Tất cả loại đối tượng',
  'Resource ID (exact match)': 'Mã hoạt động',
  'Clear filters': 'Xóa bộ lọc',
  'Choose a catalog product': 'Chọn sản phẩm trong danh mục',
  'Search by product name or SKU…': 'Tìm theo tên hoặc mã sản phẩm…',
  'Searching products…': 'Đang tìm sản phẩm…',
  'No matching products found.': 'Không tìm thấy sản phẩm phù hợp.',
  'Try another name or SKU, or use a custom item.':
    'Thử tên hoặc mã khác, hoặc dùng mặt hàng tùy chỉnh.',
  '{{shown}} of {{total}} products': '{{shown}} / {{total}} sản phẩm',
  'Load more products': 'Tải thêm sản phẩm',
  'Use a custom item': 'Dùng mặt hàng tùy chỉnh',
  'Organization role': 'Vai trò trong tổ chức',
  'Request review': 'Xét duyệt yêu cầu',
  'Approval comment (optional)': 'Ghi chú phê duyệt (không bắt buộc)',
  'Rejection reason': 'Lý do từ chối',
  'Confirm approval': 'Xác nhận phê duyệt',
  'Confirm rejection': 'Xác nhận từ chối',
  'A rejection reason is required.': 'Vui lòng nhập lý do từ chối.',
  'Comments must be at most 1,000 characters.':
    'Ghi chú không được vượt quá 1.000 ký tự.',
  'Add context for the requester…': 'Thêm ghi chú cho người gửi yêu cầu…',
  'Explain why this request cannot be approved…':
    'Giải thích vì sao yêu cầu này chưa thể được phê duyệt…',
  'Your decision and comment will appear in the request history.':
    'Quyết định và ghi chú sẽ được lưu trong lịch sử yêu cầu.',
  'Request for another department': 'Tạo yêu cầu cho phòng ban khác',
  'Automatically assigned from your primary department.':
    'Tự động lấy từ phòng ban chính của bạn.',
  'You have no primary department. Choose the department you are requesting for.':
    'Bạn chưa có phòng ban chính. Hãy chọn phòng ban cần tạo yêu cầu.',
  'Choose a valid department in this organization before saving.':
    'Vui lòng chọn phòng ban hợp lệ trong tổ chức trước khi lưu.',
  'Your department has changed. Saving this draft will move it to your current primary department.':
    'Phòng ban của bạn đã thay đổi. Khi lưu, bản nháp này sẽ được chuyển về phòng ban chính hiện tại.',
  'Department code already exists in this organization':
    'Mã phòng ban đã tồn tại trong tổ chức.',
  ADMIN: 'Quản trị viên',
  EMPLOYEE: 'Nhân viên',
  'Primary department': 'Phòng ban chính',
  'Department role': 'Vai trò trong phòng ban',
  'Department member': 'Nhân viên phòng ban',
  'Department lead': 'Trưởng phòng',
  Unassigned: 'Chưa phân phòng',
  'Assign department': 'Phân phòng ban',
  'Assign primary department': 'Phân phòng ban chính',
  'Save assignment': 'Lưu phân công',
  'Edit department': 'Sửa phòng ban',
  'Save department': 'Lưu phòng ban',
  'One primary department per organization. A department lead can manage only that department, not the entire organization.':
    'Mỗi người có một phòng ban chính trong tổ chức. Trưởng phòng chỉ quản lý phòng của mình, không quản lý toàn tổ chức.',
  'This department already has a lead. Reassign the current lead first.':
    'Phòng ban đã có trưởng phòng. Hãy đổi phân công của trưởng phòng hiện tại trước.',
  'You cannot approve or reject your own request':
    'Bạn không được tự duyệt hoặc từ chối yêu cầu của mình.',
  'You can only create requests for your assigned department':
    'Bạn chỉ được tạo yêu cầu cho phòng ban được phân công.',
  'Ask a manager to assign your primary department before creating a request.':
    'Liên hệ quản lý để được phân phòng ban chính trước khi tạo yêu cầu.',
  'CATALOG · TAXONOMY': 'DANH MỤC · PHÂN LOẠI',
  'GOVERNANCE · TRACEABILITY': 'QUẢN TRỊ · TRUY VẾT',
  'OPERATIONS · STOCK CONTROL': 'NGHIỆP VỤ · QUẢN LÝ KHO',
  'PROCUREMENT · ORDERING': 'MUA SẮM · ĐẶT HÀNG',
  'WORKFLOW · REQUISITIONS': 'QUY TRÌNH · YÊU CẦU MUA HÀNG',
  'WORKSPACE · ACCESS': 'TỔ CHỨC · QUYỀN TRUY CẬP',
  PROCUREMENTS: 'MUA SẮM',
  PROCUREMENT: 'MUA SẮM',
  Procurement: 'Mua sắm',
  Category: 'Danh mục',
  Manager: 'Quản lý',
  ORDER: 'ĐƠN HÀNG',
  SUPPLIER: 'NHÀ CUNG CẤP',
  TOTAL: 'TỔNG TIỀN',
  OK: 'SẴN SÀNG',
  UNKNOWN: 'CHƯA XÁC ĐỊNH',
  Showing: 'Đang hiển thị',
  Received: 'Đã nhận hàng',
  Requester: 'Người yêu cầu',
  Resource: 'Đối tượng',
  by: 'bởi',
  'Choose an organization': 'Chọn tổ chức',
  'Choose an organization to continue.': 'Chọn tổ chức để tiếp tục.',
  'Updating data…': 'Đang cập nhật dữ liệu…',
  'Search products': 'Tìm sản phẩm',
  'Search by name or SKU…': 'Tìm theo tên hoặc mã sản phẩm…',
  'Try a different name or SKU.': 'Thử tên hoặc mã sản phẩm khác.',
  'Search orders': 'Tìm đơn hàng',
  'Order number or supplier…': 'Mã đơn hoặc nhà cung cấp…',
  'Live orders in the selected organization':
    'Đơn hàng hiện tại của tổ chức đang chọn',
  'Recent purchase orders': 'Đơn đặt hàng gần đây',
  'No purchase orders found': 'Không tìm thấy đơn đặt hàng',
  'Create an order from an approved request or adjust the filters.':
    'Tạo đơn từ yêu cầu đã duyệt hoặc điều chỉnh bộ lọc.',
  'Order value by status': 'Giá trị đơn hàng theo trạng thái',
  'Order face value, not payments or accounting spend':
    'Giá trị trên đơn, không phải khoản đã thanh toán hay chi phí kế toán',
  'Products without available stock': 'Sản phẩm không có hàng khả dụng',
  '{{count}} orders': '{{count}} đơn',
  '{{count}} approved requests': '{{count}} yêu cầu đã duyệt',
  'Purchase request {{id}}': 'Yêu cầu mua hàng {{id}}',
  'Clear selection': 'Bỏ chọn',
  'Load order': 'Xem đơn hàng',
  'Only organization OWNER and MANAGER members can create or transition purchase orders.':
    'Chỉ chủ sở hữu và quản lý tổ chức được tạo hoặc chuyển trạng thái đơn đặt hàng.',
  'Enter a whole number.': 'Nhập số nguyên hợp lệ.',
  'Enter a number with up to two decimal places.':
    'Nhập số hợp lệ với tối đa hai chữ số thập phân.',
  'The number exceeds the supported limit.':
    'Số nhập vượt quá giới hạn cho phép.',
  'The amount cannot be negative.': 'Số tiền không được âm.',
  'The value must be greater than zero.': 'Giá trị phải lớn hơn không.',
  'Remove line {{number}}': 'Xóa dòng {{number}}',
  'Explain what the team needs and why.': 'Mô tả nhu cầu và lý do cần mua.',
  'Optional delivery or specification notes':
    'Ghi chú giao hàng hoặc thông số kỹ thuật (không bắt buộc)',
  'e.g. New joiner equipment': 'VD: Thiết bị cho nhân viên mới',
  'e.g. Northstar Office Supply': 'VD: Nhà cung cấp văn phòng Bắc Sao',
  'e.g. Northstar Operations': 'VD: Công ty Bắc Sao',
  'Add child category under {{name}}': 'Thêm danh mục con vào {{name}}',
  'Soft-delete {{name}}?': 'Ẩn {{name}} khỏi danh mục?',
  'Soft-delete {{name}}? Categories with active products cannot be removed.':
    'Ẩn {{name}} khỏi danh mục? Không thể ẩn danh mục đang có sản phẩm.',
  'Create organization': 'Tạo tổ chức',
  'Add department': 'Thêm phòng ban',
  'Add member': 'Thêm thành viên',
  'Organization membership': 'Thông tin thành viên tổ chức',
  'View your organization, your access, and its departments.':
    'Xem tổ chức, quyền của bạn và thông tin phòng ban.',
  'Ask your organization manager to add your account to a workspace.':
    'Liên hệ quản lý tổ chức để được thêm tài khoản vào không gian làm việc.',
  'Start with an employee account. Ask a manager to add you to your organization after signing in.':
    'Bắt đầu với tài khoản nhân viên. Sau khi đăng nhập, liên hệ quản lý để được thêm vào tổ chức.',
  '{{count}} departments in the active organization':
    '{{count}} phòng ban trong tổ chức hiện tại',
  '{{count}} members · access is enforced by the API':
    '{{count}} thành viên trong tổ chức này',
  'Member removal and role changes do not have backend endpoints yet. This page only exposes operations the API currently supports.':
    'Hiện chưa thể xóa thành viên hoặc thay đổi vai trò trong tổ chức.',
  '{{count}} matching events': '{{count}} sự kiện phù hợp',
  'System / deleted user': 'Hệ thống / người dùng đã xóa',
  'Audit coverage currently includes purchase requests, purchase orders, and manual stock-in. Catalog, membership, and authentication actions are not represented by this audit API.':
    'Lịch sử hiện gồm yêu cầu mua hàng, đơn đặt hàng và nhập kho thủ công. Một số thay đổi khác có thể chưa xuất hiện.',
  PURCHASE_REQUEST_CREATED: 'Tạo yêu cầu mua hàng',
  PURCHASE_REQUEST_UPDATED: 'Cập nhật yêu cầu mua hàng',
  PURCHASE_REQUEST_STATUS_CHANGED: 'Chuyển trạng thái yêu cầu',
  PURCHASE_ORDER_CREATED: 'Tạo đơn đặt hàng',
  PURCHASE_ORDER_ISSUED: 'Phát hành đơn đặt hàng',
  PURCHASE_ORDER_RECEIVED: 'Nhận hàng theo đơn',
  PURCHASE_ORDER_CANCELLED: 'Hủy đơn đặt hàng',
  INVENTORY_STOCKED_IN: 'Nhập kho thủ công',
  INVENTORY_REORDER_POLICY_UPDATED: 'Cập nhật mức nhắc nhập hàng',
  PURCHASE_REQUEST: 'Yêu cầu mua hàng',
  PURCHASE_ORDER: 'Đơn đặt hàng',
  INVENTORY: 'Tồn kho',
  'Unable to reach the API. Check your connection and try again.':
    'Không thể kết nối hệ thống. Kiểm tra kết nối rồi thử lại.',
  'Check the entered values and try again.':
    'Kiểm tra các giá trị đã nhập rồi thử lại.',
  'Your session has expired. Please sign in again.':
    'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  'You do not have permission to perform this action.':
    'Bạn không có quyền thực hiện thao tác này.',
  'This record was not found in your workspace.':
    'Không tìm thấy dữ liệu này trong tổ chức của bạn.',
  'The record already exists or its status has changed. Reload the data and try again.':
    'Dữ liệu đã tồn tại hoặc trạng thái đã thay đổi. Cập nhật dữ liệu rồi thử lại.',
  'Too many requests. Please wait and try again.':
    'Thao tác quá nhanh. Vui lòng chờ rồi thử lại.',
  'The server could not complete this request. Please try again later.':
    'Chưa thể thực hiện thao tác này. Vui lòng thử lại sau.',
  'There is not enough available stock for this request.':
    'Không đủ tồn kho khả dụng cho yêu cầu này.',
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
  'Connected to your API': 'Không gian làm việc đã sẵn sàng',
  'Live workspace data': 'Dữ liệu trực tiếp',
  'Collapse sidebar': 'Thu gọn thanh bên',
  'Select organization': 'Chọn tổ chức',
  'Active organization': 'Tổ chức hiện tại',
  'Sign out': 'Đăng xuất',
  'Procurement workspace': 'Không gian nghiệp vụ mua sắm',
  'Connected to the configured API': 'Đã kết nối không gian làm việc',
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
    'Hoạt động hiện tại trong tổ chức',
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
  'Procurement API readiness': 'Tình trạng dịch vụ',
  'API readiness needs attention': 'Một số dịch vụ cần được kiểm tra',
  'The readiness endpoint could not confirm all dependencies.':
    'Chưa thể xác nhận tất cả dịch vụ đang hoạt động bình thường.',
  'Last checked': 'Kiểm tra lần cuối',
  'just now': 'vừa xong',
  'checking…': 'đang kiểm tra…',
  CHECKING: 'ĐANG KIỂM TRA',
  'CHECK REQUIRED': 'CẦN KIỂM TRA',
  'Counts are returned by the API; cancelled requests are omitted from the visual pipeline.':
    'Yêu cầu đã hủy không được tính trong phần tổng quan này.',
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
    'Tổng giá trị đơn hàng và số đơn đang mở.',
  'Inventory ledger': 'Hoạt động tồn kho',
  'Stock movements and request-driven reservations are recorded in the inventory transaction history.':
    'Lịch sử ghi nhận hàng nhập và thay đổi tồn kho khi xử lý yêu cầu.',
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
    'Thông tin đăng nhập chỉ được dùng để truy cập không gian làm việc.',
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
    'Chỉ chủ sở hữu và quản lý tổ chức mới có thể xem lịch sử hoạt động.',
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
    'Thử tên, mã sản phẩm hoặc danh mục khác.',
  'Create a product to make it available for requests.':
    'Tạo sản phẩm để nhân viên có thể đưa vào yêu cầu mua hàng.',
  Uncategorized: 'Chưa phân loại',
  'No description provided': 'Chưa có mô tả',
  'Search current product page': 'Tìm trong trang sản phẩm hiện tại',
  'Search this page…': 'Tìm trong trang này…',
  'Actions are limited to supported API operations':
    'Chỉ hiển thị thao tác hiện có',
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
    'bao gồm các danh mục con trực tiếp',
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
  'Audit trail': 'Lịch sử hoạt động',
  'Review important procurement and inventory changes recorded by the backend.':
    'Theo dõi các thay đổi mua sắm và tồn kho được backend ghi nhận.',
  'Append-only operational record':
    'Lịch sử ghi lại các thay đổi quan trọng trong tổ chức này.',
  'ORGANIZATION SCOPED': 'TRONG TỔ CHỨC NÀY',
  'Recorded events': 'Sự kiện đã ghi nhận',
  'Filter events': 'Lọc sự kiện',
  Action: 'Thao tác',
  'Resource type': 'Loại hoạt động',
  'Resource ID': 'Mã hoạt động',
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
  'Stock-in or a reorder policy can initialize this product’s inventory record.':
    'Nhập kho hoặc thiết lập chính sách đặt hàng lại sẽ tạo bản ghi tồn kho cho sản phẩm này.',
  'Refresh inventory': 'Làm mới tồn kho',
  Available: 'Khả dụng',
  Reserved: 'Đã giữ',
  'Total on hand': 'Tổng tồn kho',
  'Last updated': 'Cập nhật lần cuối',
  'Balance and ledger update atomically':
    'Số lượng tồn và lịch sử hoạt động được cập nhật cùng lúc',
  'Current balance': 'Số dư hiện tại',
  'Available, reserved, and total quantities':
    'Số lượng khả dụng, đã giữ và tổng cộng',
  'Manual stock-in': 'Nhập kho thủ công',
  'Organization manager workflow': 'Quy trình dành cho quản lý tổ chức',
  'Transaction history': 'Lịch sử giao dịch',
  'Paginated history is available from the inventory API':
    'Có thể xem hoạt động tồn kho theo từng trang',
  'Reorder threshold': 'Ngưỡng đặt hàng lại',
  'Reorder policy': 'Chính sách đặt hàng lại',
  'Set the low-stock trigger and desired replenishment level for the selected product.':
    'Thiết lập ngưỡng cảnh báo và mức tồn mong muốn cho sản phẩm đang chọn.',
  'Choose a product to manage its reorder policy':
    'Chọn sản phẩm để thiết lập chính sách đặt hàng lại',
  'The policy is stored with the product’s organization inventory.':
    'Chính sách được lưu cùng tồn kho của sản phẩm trong tổ chức.',
  'Loading reorder policy…': 'Đang tải chính sách đặt hàng lại…',
  'Reorder alerts are enabled for this product.':
    'Sản phẩm này đã bật cảnh báo đặt hàng lại.',
  'Reorder alerts are currently disabled.':
    'Sản phẩm này hiện đang tắt cảnh báo đặt hàng lại.',
  'Reorder point': 'Ngưỡng đặt hàng lại',
  'Alert when available stock reaches this quantity.':
    'Cảnh báo khi lượng hàng khả dụng chạm mức này.',
  'Target stock': 'Mức tồn mục tiêu',
  'Suggested order quantity restores stock toward this level.':
    'Số lượng đề xuất sẽ bổ sung tồn kho hướng đến mức này.',
  'Incoming quantities count issued purchase orders only. Draft orders are not treated as stock on the way.':
    'Chỉ tính số lượng trên đơn đặt hàng đã phát hành. Đơn nháp chưa được xem là hàng đang về.',
  'Target stock must be greater than the reorder point.':
    'Mức tồn mục tiêu phải lớn hơn ngưỡng đặt hàng lại.',
  'Disable policy': 'Tắt chính sách',
  'Save reorder policy': 'Lưu chính sách',
  'Reorder alerts': 'Cảnh báo đặt hàng lại',
  'Live stock conditions calculated from current inventory and issued purchase orders.':
    'Tình trạng tồn kho được tính trực tiếp từ tồn hiện tại và đơn đặt hàng đã phát hành.',
  'Search reorder alerts': 'Tìm cảnh báo',
  'Product name or SKU…': 'Tên hoặc mã sản phẩm…',
  'Stock condition': 'Tình trạng tồn kho',
  'All reorder alerts': 'Tất cả cảnh báo',
  'Out of stock': 'Hết hàng',
  'Low stock': 'Sắp hết hàng',
  'Suggested order': 'Số lượng đề xuất',
  'Loading reorder alerts…': 'Đang tải cảnh báo tồn kho…',
  'No reorder alerts': 'Không có cảnh báo tồn kho',
  'Try clearing the search or stock condition filter.':
    'Thử xóa nội dung tìm kiếm hoặc bộ lọc tình trạng tồn kho.',
  'Products with an enabled policy will appear here when available stock reaches their reorder point.':
    'Sản phẩm đã bật chính sách sẽ xuất hiện khi lượng hàng khả dụng chạm ngưỡng đặt hàng lại.',
  'Manager-configured alerts and issued-order quantities':
    'Quản lý cấu hình cảnh báo và lượng hàng đang về theo đơn đã phát hành',
  LOW_STOCK: 'Sắp hết hàng',
  OUT_OF_STOCK: 'Hết hàng',
  'No threshold exists in the current product/inventory schema':
    'Lược đồ sản phẩm/tồn kho hiện chưa có ngưỡng đặt hàng lại',
  AVAILABLE: 'ĐANG CÓ',
  'API GAP': 'CHƯA CÓ TÍNH NĂNG',
  ACTIVITY: 'HOẠT ĐỘNG',
  QUANTITY: 'SỐ LƯỢNG',
  REFERENCE: 'MÃ THAM CHIẾU',
  RECORDED: 'THỜI GIAN',
  'Manual entry': 'Nhập thủ công',
  'Showing {{shown}} of {{total}} ledger events':
    'Đang hiển thị {{shown}} trên {{total}} hoạt động',
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
    'Chưa thể chọn sản phẩm cho tổ chức này. Bạn vẫn có thể nhập mặt hàng thủ công.',
  'No business justification provided.': 'Chưa có lý do nghiệp vụ.',
  'Client estimate preview': 'Ước tính tạm tính',
  'Final total is calculated and returned by the server.':
    'Tổng tiền cuối cùng được tính tự động.',
  'SERVER TOTAL': 'TỔNG TIỀN CUỐI CÙNG',
  'Requested items': 'Mặt hàng được yêu cầu',
  'Status history': 'Lịch sử trạng thái',
  'Line items': 'Các mặt hàng',
  'Totals are calculated by the API from quantity and estimated unit price.':
    'Tổng tiền được tính từ số lượng và đơn giá ước tính.',
  'Select department…': 'Chọn phòng ban…',
  'Custom item': 'Mặt hàng tùy chỉnh',
  'Approved requests': 'Yêu cầu đã duyệt',
  'Nothing is ready to order': 'Chưa có yêu cầu sẵn sàng đặt hàng',
  'An organization manager can create purchase orders once requests are approved.':
    'Quản lý tổ chức có thể tạo đơn đặt hàng khi yêu cầu được duyệt.',
  'Create from request': 'Tạo từ yêu cầu',
  'Find a purchase order': 'Tìm đơn đặt hàng',
  'Retrieve one order by its server-issued UUID': 'Nhập mã đơn hàng để tìm.',
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
    'Số lượng tồn hiện tại của sản phẩm đã chọn',
  'Adds quantity to available inventory in a backend transaction':
    'Ghi nhận hàng mới nhập và cập nhật số lượng hiện có',
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
  'Search by name, SKU, or category': 'Tìm theo tên, mã sản phẩm hoặc danh mục',
  'Catalog size': 'Quy mô danh mục',
  'Product categories': 'Danh mục sản phẩm',
  'API-connected catalog': 'Danh mục sản phẩm hiện tại',
  'SKU, category, and list price': 'Mã sản phẩm, danh mục và giá',
  PRODUCT: 'SẢN PHẨM',
  SKU: 'Mã sản phẩm',
  CATEGORY: 'DANH MỤC',
  'UNIT PRICE': 'ĐƠN GIÁ',
  UPDATED: 'CẬP NHẬT',
  'CATALOG SIZE': 'QUY MÔ DANH MỤC',
  'PRODUCT CATEGORIES': 'DANH MỤC SẢN PHẨM',
  'Edit product': 'Chỉnh sửa sản phẩm',
  'Add product': 'Thêm sản phẩm',
  'Product name': 'Tên sản phẩm',
  'Leave blank to let the API generate one.': 'Để trống để hệ thống tự tạo mã.',
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
    'Chọn sản phẩm để xem số lượng tồn.',
  'This API version does not yet expose organization-scoped inventory search.':
    'Chưa thể tìm tồn kho theo tổ chức này.',
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
    'Mỗi mục lịch sử được lưu cùng với thao tác tương ứng.',
  'Select an organization to load its audit trail.':
    'Chọn tổ chức để tải nhật ký kiểm toán.',
  'The current API reads catalog data from the default acme-procurement organization. Product operations are paused here so writes cannot disappear from this view. Select that workspace or extend the backend’s catalog read endpoints for tenant-aware access.':
    'API hiện đọc danh mục từ tổ chức acme-procurement mặc định. Thao tác sản phẩm đang tạm khóa để dữ liệu không bị ghi vào nơi khác. Hãy chọn tổ chức đó hoặc mở rộng API backend để đọc theo từng tổ chức.',
  'soft-deleted records are hidden': 'Sản phẩm đã ẩn sẽ không hiển thị',
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
  'Inventory transaction history': 'Hoạt động tồn kho',
  'Current backend capabilities': 'Các tính năng quản lý tồn kho hiện có',
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
  'Not found': 'Không tìm thấy',
  'Page not found': 'Không tìm thấy trang',
  'Back to workspace': 'Về không gian làm việc',
  'Back to list': 'Quay lại danh sách',
  'Check again': 'Kiểm tra lại',
  'This link may have changed or the page may no longer exist.':
    'Liên kết có thể đã thay đổi hoặc trang không còn tồn tại.',
  'This feature is not available on the connected server.':
    'Máy chủ đang kết nối chưa cung cấp tính năng này.',
  'Check the link or return to the list to continue.':
    'Kiểm tra liên kết hoặc quay lại danh sách để tiếp tục.',
  'Ask your organization manager to assign your primary department before creating a request.':
    'Nhờ quản lý tổ chức phân công phòng ban chính trước khi tạo yêu cầu.',
  'Update the draft to your current primary department before submitting it':
    'Cập nhật bản nháp về phòng ban chính hiện tại trước khi gửi.',
  'The request total exceeds the supported limit':
    'Tổng giá trị yêu cầu vượt giới hạn cho phép.',
};

const en = {
  Activity: 'Activity',
  SOURCE: 'SOURCE',
  'Purchase request or order': 'Purchase request or order',
  'Direct stock entry': 'Direct stock entry',
  STOCK_IN: 'Stock received',
  RESERVE: 'Held for a request',
  RELEASE: 'Returned to stock',
  FULFILL: 'Issued for a request',
  PURCHASE_REQUEST_CREATED: 'Purchase request created',
  PURCHASE_REQUEST_UPDATED: 'Purchase request updated',
  PURCHASE_REQUEST_STATUS_CHANGED: 'Request status changed',
  PURCHASE_ORDER_CREATED: 'Purchase order created',
  PURCHASE_ORDER_ISSUED: 'Purchase order sent to supplier',
  PURCHASE_ORDER_RECEIVED: 'Purchase order received',
  PURCHASE_ORDER_CANCELLED: 'Purchase order cancelled',
  INVENTORY_STOCKED_IN: 'Stock received',
  INVENTORY_REORDER_POLICY_UPDATED: 'Restock settings changed',
  PURCHASE_REQUEST: 'Purchase request',
  PURCHASE_ORDER: 'Purchase order',
  INVENTORY: 'Inventory',
};

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: 'en',
  fallbackLng: 'en',
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export { i18n };
