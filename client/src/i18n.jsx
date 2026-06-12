import { createContext, useContext, useState } from 'react';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/vi';

export const LANGS = [
  { value: 'en', label: 'EN' },
  { value: 'zh', label: '中文' },
  { value: 'vi', label: 'Tiếng Việt' },
];

export const ANTD_LOCALES = { en: enUS, zh: zhCN, vi: viVN };
const DAYJS_LOCALES = { en: 'en', zh: 'zh-cn', vi: 'vi' };

const DICT = {
  en: {
    'app.title': '🚗 Office Car Booking', 'app.carBooking': '🚗 Car Booking', 'app.driver': '🚗 Driver',
    'common.refresh': 'Refresh', 'common.back': 'Back', 'common.cancel': 'Cancel', 'common.save': 'Save', 'common.send': 'Send', 'common.logout': 'Logout', 'common.comingSoon': 'Coming soon', 'common.loading': 'Loading',
    'nav.book': 'Book', 'nav.bookFull': 'Book a Vehicle', 'nav.myBookings': 'My Bookings', 'nav.notifications': 'Notifications', 'nav.alerts': 'Alerts', 'nav.profile': 'Profile', 'nav.myTrips': 'My Trips', 'nav.manageBookings': 'Manage Bookings', 'nav.dashboard': 'Dashboard', 'nav.bookings': 'Bookings', 'nav.vehicles': 'Vehicles', 'nav.calendar': 'Calendar', 'nav.users': 'Users', 'nav.reports': 'Reports', 'nav.settings': 'Settings', 'nav.feedback': 'Feedback', 'nav.driver': 'Driver',
    'login.email': 'Email', 'login.password': 'Password', 'login.signIn': 'Sign in', 'login.setForgot': 'Set / forgot password', 'login.requestHint': 'Enter your email to receive a one-time code. New here? This also registers you.', 'login.sendCode': 'Send code', 'login.backToSignIn': 'Back to sign in', 'login.resetHint': 'We sent a 6-digit code to {email}. (Dev: check the server console.) Enter it and choose a password.', 'login.code': '6-digit code', 'login.newPassword': 'New password', 'login.min8': 'At least 8 characters', 'login.setAndSignIn': 'Set password & sign in', 'login.wrongCreds': 'Wrong email or password.', 'login.codeSent': 'If the email is valid, a code was sent. (Dev: check the server console.)', 'login.invalidCode': 'Invalid or expired code.', 'login.error': 'Something went wrong.',
    'status.pending': 'Pending', 'status.approved': 'Approved', 'status.rejected': 'Rejected', 'status.completed': 'Completed', 'status.no_show': 'No show', 'status.cancelled': 'Cancelled', 'status.maintenance': 'Maintenance', 'status.active': 'Active', 'status.inactive': 'Inactive',
    'book.title': 'Book a Vehicle', 'book.stepCar': 'Car', 'book.stepDay': 'Day', 'book.stepSlot': 'Slot', 'book.stepDetails': 'Details', 'book.pickDay': 'pick a day', 'book.greenOpen': '(green = open)', 'book.change': 'Change', 'book.noVehicles': 'No vehicles', 'book.pickSlot': 'pick a slot', 'book.quickBook': 'Quick book', 'book.destination': 'Destination', 'book.purpose': 'Purpose', 'book.passengers': 'Passengers', 'book.contact': 'Contact number', 'book.requester': 'Requester name', 'book.department': 'Department', 'book.review': 'Review', 'book.submit': 'Submit booking', 'book.findCars': 'Find available cars', 'book.submitted': 'Booking {code} submitted — awaiting approval.', 'book.slotTaken': 'That slot was just taken. Pick another.', 'book.failed': 'Booking failed.', 'book.couldNotLoad': 'Could not load availability.',
    'my.title': 'My Bookings', 'my.tabAll': 'All', 'my.tabUpcoming': 'Upcoming', 'my.tabPast': 'Past', 'my.tabCancelled': 'Cancelled', 'my.groupByDay': 'Group by day', 'my.none': 'No bookings here', 'my.cancelConfirm': 'Cancel this booking?', 'my.cancelled': 'Booking cancelled.', 'my.cancelErr': 'Could not cancel (only pending bookings can be cancelled).', 'my.cancelBooking': 'Cancel booking', 'my.loadErr': 'Could not load your bookings.',
    'f.status': 'Status', 'f.date': 'Date', 'f.slot': 'Slot', 'f.vehicle': 'Vehicle', 'f.destination': 'Destination', 'f.purpose': 'Purpose', 'f.passengers': 'Passengers', 'f.phone': 'Phone', 'f.employee': 'Employee', 'f.department': 'Department',
    'driver.today': 'Today', 'driver.upcomingOther': 'Upcoming & other', 'driver.noToday': 'No trips today.', 'driver.noTrips': 'No trips assigned', 'driver.noPending': 'No pending trips', 'driver.filterPending': 'Pending', 'driver.filterAll': 'All', 'driver.groupDay': 'Group day', 'driver.confirm': 'Confirm', 'driver.deny': 'Deny', 'driver.markCompleted': 'Mark completed', 'driver.noShow': 'No-show', 'driver.availableOn': 'Available on the trip day ({date}).', 'driver.denyTitle': 'Deny trip', 'driver.denyHint': 'The employee and admins will be notified with your reason.', 'driver.reasonPh': 'Why are you denying? (e.g. vehicle issue, schedule clash)', 'driver.maintenance': 'Maintenance', 'driver.confirmed': 'confirmed', 'driver.actionErr': 'Action not allowed.', 'driver.loadErr': 'Could not load your trips.', 'driver.vehErr': 'Could not update vehicle.',
    'profile.title': 'Profile', 'profile.name': 'Name', 'profile.email': 'Email', 'profile.department': 'Department', 'profile.role': 'Role', 'profile.save': 'Save profile', 'profile.updated': 'Profile updated.', 'profile.updateErr': 'Could not update profile.', 'profile.changePassword': 'Change password', 'profile.newPassword': 'New password', 'profile.confirmPassword': 'Confirm password', 'profile.mismatch': 'Passwords do not match', 'profile.pwChanged': 'Password changed.', 'profile.pwErr': 'Could not change password.', 'profile.reenter': 'Re-enter password',
    'notif.title': 'Notifications', 'notif.markAllRead': 'Mark all read', 'notif.none': 'No notifications', 'notif.new': 'new', 'notif.viewAll': 'View all',
    'fb.button': 'Feedback', 'fb.title': 'Send feedback', 'fb.type': 'Type', 'fb.bug': '🐞 Bug', 'fb.idea': '💡 Idea / request', 'fb.question': '❓ Question', 'fb.other': 'Other', 'fb.message': 'Message', 'fb.thanks': 'Thanks for the feedback!', 'fb.err': 'Could not send feedback. Try again.', 'fb.placeholder': 'What happened, or what would you like to see?', 'fb.describe': 'Please describe it',
  },
  zh: {
    'app.title': '🚗 公司用车预订', 'app.carBooking': '🚗 用车预订', 'app.driver': '🚗 司机',
    'common.refresh': '刷新', 'common.back': '返回', 'common.cancel': '取消', 'common.save': '保存', 'common.send': '发送', 'common.logout': '退出', 'common.comingSoon': '即将推出', 'common.loading': '加载中',
    'nav.book': '预订', 'nav.bookFull': '预订车辆', 'nav.myBookings': '我的预订', 'nav.notifications': '通知', 'nav.alerts': '通知', 'nav.profile': '个人资料', 'nav.myTrips': '我的行程', 'nav.manageBookings': '预订管理', 'nav.dashboard': '仪表盘', 'nav.bookings': '预订', 'nav.vehicles': '车辆', 'nav.calendar': '日历', 'nav.users': '用户', 'nav.reports': '报表', 'nav.settings': '设置', 'nav.feedback': '反馈', 'nav.driver': '司机',
    'login.email': '邮箱', 'login.password': '密码', 'login.signIn': '登录', 'login.setForgot': '设置 / 忘记密码', 'login.requestHint': '输入邮箱以获取一次性验证码。新用户将自动注册。', 'login.sendCode': '发送验证码', 'login.backToSignIn': '返回登录', 'login.resetHint': '已向 {email} 发送 6 位验证码。（开发环境：请查看服务器控制台。）请输入并设置密码。', 'login.code': '6 位验证码', 'login.newPassword': '新密码', 'login.min8': '至少 8 位', 'login.setAndSignIn': '设置密码并登录', 'login.wrongCreds': '邮箱或密码错误。', 'login.codeSent': '若邮箱有效，验证码已发送。（开发环境：请查看服务器控制台。）', 'login.invalidCode': '验证码无效或已过期。', 'login.error': '出错了。',
    'status.pending': '待处理', 'status.approved': '已批准', 'status.rejected': '已拒绝', 'status.completed': '已完成', 'status.no_show': '未到', 'status.cancelled': '已取消', 'status.maintenance': '维护', 'status.active': '可用', 'status.inactive': '停用',
    'book.title': '预订车辆', 'book.stepCar': '车辆', 'book.stepDay': '日期', 'book.stepSlot': '时段', 'book.stepDetails': '详情', 'book.pickDay': '选择日期', 'book.greenOpen': '（绿色 = 可订）', 'book.change': '更改', 'book.noVehicles': '暂无车辆', 'book.pickSlot': '选择时段', 'book.quickBook': '快速预订', 'book.destination': '目的地', 'book.purpose': '事由', 'book.passengers': '乘客数', 'book.contact': '联系电话', 'book.requester': '申请人', 'book.department': '部门', 'book.review': '确认', 'book.submit': '提交预订', 'book.findCars': '查找可用车辆', 'book.submitted': '预订 {code} 已提交，等待确认。', 'book.slotTaken': '该时段刚被预订，请另选。', 'book.failed': '预订失败。', 'book.couldNotLoad': '无法加载可用情况。',
    'my.title': '我的预订', 'my.tabAll': '全部', 'my.tabUpcoming': '即将', 'my.tabPast': '已过', 'my.tabCancelled': '已取消', 'my.groupByDay': '按天分组', 'my.none': '暂无预订', 'my.cancelConfirm': '取消该预订？', 'my.cancelled': '预订已取消。', 'my.cancelErr': '无法取消（仅可取消待处理预订）。', 'my.cancelBooking': '取消预订', 'my.loadErr': '无法加载您的预订。',
    'f.status': '状态', 'f.date': '日期', 'f.slot': '时段', 'f.vehicle': '车辆', 'f.destination': '目的地', 'f.purpose': '事由', 'f.passengers': '乘客数', 'f.phone': '电话', 'f.employee': '员工', 'f.department': '部门',
    'driver.today': '今天', 'driver.upcomingOther': '即将及其他', 'driver.noToday': '今天没有行程。', 'driver.noTrips': '暂无分配行程', 'driver.noPending': '没有待处理行程', 'driver.filterPending': '待处理', 'driver.filterAll': '全部', 'driver.groupDay': '按天', 'driver.confirm': '确认', 'driver.deny': '拒绝', 'driver.markCompleted': '标记完成', 'driver.noShow': '未到', 'driver.availableOn': '行程当天可操作（{date}）。', 'driver.denyTitle': '拒绝行程', 'driver.denyHint': '员工和管理员将收到您的理由。', 'driver.reasonPh': '拒绝原因？（如车辆故障、时间冲突）', 'driver.maintenance': '维护', 'driver.confirmed': '已确认', 'driver.actionErr': '操作不被允许。', 'driver.loadErr': '无法加载您的行程。', 'driver.vehErr': '无法更新车辆。',
    'profile.title': '个人资料', 'profile.name': '姓名', 'profile.email': '邮箱', 'profile.department': '部门', 'profile.role': '角色', 'profile.save': '保存资料', 'profile.updated': '资料已更新。', 'profile.updateErr': '无法更新资料。', 'profile.changePassword': '修改密码', 'profile.newPassword': '新密码', 'profile.confirmPassword': '确认密码', 'profile.mismatch': '两次密码不一致', 'profile.pwChanged': '密码已修改。', 'profile.pwErr': '无法修改密码。', 'profile.reenter': '再次输入密码',
    'notif.title': '通知', 'notif.markAllRead': '全部标为已读', 'notif.none': '暂无通知', 'notif.new': '新', 'notif.viewAll': '查看全部',
    'fb.button': '反馈', 'fb.title': '发送反馈', 'fb.type': '类型', 'fb.bug': '🐞 缺陷', 'fb.idea': '💡 建议 / 需求', 'fb.question': '❓ 问题', 'fb.other': '其他', 'fb.message': '内容', 'fb.thanks': '感谢您的反馈！', 'fb.err': '发送失败，请重试。', 'fb.placeholder': '发生了什么，或您希望看到什么？', 'fb.describe': '请描述',
  },
  vi: {
    'app.title': '🚗 Đặt xe văn phòng', 'app.carBooking': '🚗 Đặt xe', 'app.driver': '🚗 Tài xế',
    'common.refresh': 'Làm mới', 'common.back': 'Quay lại', 'common.cancel': 'Hủy', 'common.save': 'Lưu', 'common.send': 'Gửi', 'common.logout': 'Đăng xuất', 'common.comingSoon': 'Sắp ra mắt', 'common.loading': 'Đang tải',
    'nav.book': 'Đặt xe', 'nav.bookFull': 'Đặt xe', 'nav.myBookings': 'Đặt xe của tôi', 'nav.notifications': 'Thông báo', 'nav.alerts': 'Thông báo', 'nav.profile': 'Hồ sơ', 'nav.myTrips': 'Chuyến của tôi', 'nav.manageBookings': 'Quản lý đặt xe', 'nav.dashboard': 'Bảng điều khiển', 'nav.bookings': 'Đặt xe', 'nav.vehicles': 'Phương tiện', 'nav.calendar': 'Lịch', 'nav.users': 'Người dùng', 'nav.reports': 'Báo cáo', 'nav.settings': 'Cài đặt', 'nav.feedback': 'Phản hồi', 'nav.driver': 'Tài xế',
    'login.email': 'Email', 'login.password': 'Mật khẩu', 'login.signIn': 'Đăng nhập', 'login.setForgot': 'Đặt / quên mật khẩu', 'login.requestHint': 'Nhập email để nhận mã OTP. Người dùng mới sẽ được đăng ký.', 'login.sendCode': 'Gửi mã', 'login.backToSignIn': 'Quay lại đăng nhập', 'login.resetHint': 'Mã 6 số đã gửi tới {email}. (Dev: xem console máy chủ.) Nhập mã và chọn mật khẩu.', 'login.code': 'Mã 6 số', 'login.newPassword': 'Mật khẩu mới', 'login.min8': 'Ít nhất 8 ký tự', 'login.setAndSignIn': 'Đặt mật khẩu & đăng nhập', 'login.wrongCreds': 'Sai email hoặc mật khẩu.', 'login.codeSent': 'Nếu email hợp lệ, mã đã được gửi. (Dev: xem console máy chủ.)', 'login.invalidCode': 'Mã không hợp lệ hoặc đã hết hạn.', 'login.error': 'Đã có lỗi xảy ra.',
    'status.pending': 'Chờ duyệt', 'status.approved': 'Đã duyệt', 'status.rejected': 'Bị từ chối', 'status.completed': 'Hoàn thành', 'status.no_show': 'Không đến', 'status.cancelled': 'Đã hủy', 'status.maintenance': 'Bảo trì', 'status.active': 'Hoạt động', 'status.inactive': 'Ngừng',
    'book.title': 'Đặt xe', 'book.stepCar': 'Xe', 'book.stepDay': 'Ngày', 'book.stepSlot': 'Khung giờ', 'book.stepDetails': 'Chi tiết', 'book.pickDay': 'chọn ngày', 'book.greenOpen': '(xanh = còn chỗ)', 'book.change': 'Đổi', 'book.noVehicles': 'Không có xe', 'book.pickSlot': 'chọn khung giờ', 'book.quickBook': 'Đặt nhanh', 'book.destination': 'Điểm đến', 'book.purpose': 'Mục đích', 'book.passengers': 'Số khách', 'book.contact': 'Số liên hệ', 'book.requester': 'Người yêu cầu', 'book.department': 'Phòng ban', 'book.review': 'Xem lại', 'book.submit': 'Gửi đặt xe', 'book.findCars': 'Tìm xe trống', 'book.submitted': 'Đã gửi đặt xe {code} — chờ duyệt.', 'book.slotTaken': 'Khung giờ vừa bị đặt. Chọn khung khác.', 'book.failed': 'Đặt xe thất bại.', 'book.couldNotLoad': 'Không tải được tình trạng xe.',
    'my.title': 'Đặt xe của tôi', 'my.tabAll': 'Tất cả', 'my.tabUpcoming': 'Sắp tới', 'my.tabPast': 'Đã qua', 'my.tabCancelled': 'Đã hủy', 'my.groupByDay': 'Nhóm theo ngày', 'my.none': 'Không có đặt xe', 'my.cancelConfirm': 'Hủy đặt xe này?', 'my.cancelled': 'Đã hủy đặt xe.', 'my.cancelErr': 'Không thể hủy (chỉ hủy được đơn chờ duyệt).', 'my.cancelBooking': 'Hủy đặt xe', 'my.loadErr': 'Không tải được đặt xe của bạn.',
    'f.status': 'Trạng thái', 'f.date': 'Ngày', 'f.slot': 'Khung giờ', 'f.vehicle': 'Xe', 'f.destination': 'Điểm đến', 'f.purpose': 'Mục đích', 'f.passengers': 'Số khách', 'f.phone': 'Điện thoại', 'f.employee': 'Nhân viên', 'f.department': 'Phòng ban',
    'driver.today': 'Hôm nay', 'driver.upcomingOther': 'Sắp tới & khác', 'driver.noToday': 'Không có chuyến hôm nay.', 'driver.noTrips': 'Chưa có chuyến nào', 'driver.noPending': 'Không có chuyến chờ', 'driver.filterPending': 'Chờ', 'driver.filterAll': 'Tất cả', 'driver.groupDay': 'Theo ngày', 'driver.confirm': 'Xác nhận', 'driver.deny': 'Từ chối', 'driver.markCompleted': 'Hoàn thành', 'driver.noShow': 'Không đến', 'driver.availableOn': 'Khả dụng vào ngày chuyến ({date}).', 'driver.denyTitle': 'Từ chối chuyến', 'driver.denyHint': 'Nhân viên và quản trị viên sẽ nhận được lý do.', 'driver.reasonPh': 'Lý do từ chối? (vd: xe hỏng, trùng lịch)', 'driver.maintenance': 'Bảo trì', 'driver.confirmed': 'đã xác nhận', 'driver.actionErr': 'Thao tác không được phép.', 'driver.loadErr': 'Không tải được chuyến của bạn.', 'driver.vehErr': 'Không cập nhật được xe.',
    'profile.title': 'Hồ sơ', 'profile.name': 'Tên', 'profile.email': 'Email', 'profile.department': 'Phòng ban', 'profile.role': 'Vai trò', 'profile.save': 'Lưu hồ sơ', 'profile.updated': 'Đã cập nhật hồ sơ.', 'profile.updateErr': 'Không cập nhật được hồ sơ.', 'profile.changePassword': 'Đổi mật khẩu', 'profile.newPassword': 'Mật khẩu mới', 'profile.confirmPassword': 'Xác nhận mật khẩu', 'profile.mismatch': 'Mật khẩu không khớp', 'profile.pwChanged': 'Đã đổi mật khẩu.', 'profile.pwErr': 'Không đổi được mật khẩu.', 'profile.reenter': 'Nhập lại mật khẩu',
    'notif.title': 'Thông báo', 'notif.markAllRead': 'Đánh dấu đã đọc', 'notif.none': 'Không có thông báo', 'notif.new': 'mới', 'notif.viewAll': 'Xem tất cả',
    'fb.button': 'Phản hồi', 'fb.title': 'Gửi phản hồi', 'fb.type': 'Loại', 'fb.bug': '🐞 Lỗi', 'fb.idea': '💡 Ý tưởng / đề xuất', 'fb.question': '❓ Câu hỏi', 'fb.other': 'Khác', 'fb.message': 'Nội dung', 'fb.thanks': 'Cảm ơn phản hồi của bạn!', 'fb.err': 'Không gửi được, thử lại.', 'fb.placeholder': 'Bạn gặp vấn đề gì, hoặc muốn thêm gì?', 'fb.describe': 'Vui lòng mô tả',
  },
};

function translate(lang, key, params) {
  let s = (DICT[lang] && DICT[lang][key]) ?? DICT.en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, v);
  return s;
}

const LangContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') || 'en');
  dayjs.locale(DAYJS_LOCALES[lang] || 'en');
  const setLang = (l) => {
    localStorage.setItem('lang', l);
    dayjs.locale(DAYJS_LOCALES[l] || 'en');
    setLangState(l);
  };
  const t = (key, params) => translate(lang, key, params);
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
