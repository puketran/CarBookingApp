// Role-based usage guidelines shown in the GuidelinesModal. Content is localized
// (en / zh / vi) and structured as do / don't lists; the modal renders ✅ / ❌.
// Title + "Got it" chrome live in i18n.jsx (guide.* keys).

export const GUIDELINES = {
  employee: {
    en: {
      dos: [
        'Arrive at the designated pick-up point at least 5 minutes early',
        'Follow the assigned vehicle and schedule',
        'Coordinate transportation requests through Admin',
        'Respect the departure time and other passengers',
      ],
      donts: [
        'Do not request additional stops',
        'Do not request route changes directly from drivers',
        'Do not ask drivers to wait beyond the scheduled time',
        'Do not directly occupy a vehicle without prior coordination',
      ],
    },
    zh: {
      dos: [
        '至少提前 5 分钟到达指定上车点',
        '遵守分配的车辆和时间安排',
        '通过管理员协调用车需求',
        '尊重发车时间和其他乘客',
      ],
      donts: [
        '请勿要求额外停靠',
        '请勿直接向司机要求更改路线',
        '请勿要求司机超出预定时间等待',
        '未经事先协调，请勿擅自占用车辆',
      ],
    },
    vi: {
      dos: [
        'Có mặt tại điểm đón được chỉ định trước ít nhất 5 phút',
        'Tuân theo xe và lịch trình được phân công',
        'Phối hợp các yêu cầu đi lại qua Quản trị viên',
        'Tôn trọng giờ khởi hành và các hành khách khác',
      ],
      donts: [
        'Không yêu cầu dừng thêm điểm',
        'Không yêu cầu tài xế đổi lộ trình trực tiếp',
        'Không yêu cầu tài xế chờ quá giờ đã định',
        'Không tự ý sử dụng xe khi chưa được phối hợp trước',
      ],
    },
  },
  driver: {
    en: {
      dos: [
        'Follow the approved transportation schedule',
        'Follow the designated routes',
        'Notify Admin of delays or incidents',
        'Prioritize passenger safety',
      ],
      donts: [],
    },
    zh: {
      dos: [
        '遵守已批准的运输时间安排',
        '按指定路线行驶',
        '及时向管理员报告延误或事故',
        '优先保障乘客安全',
      ],
      donts: [],
    },
    vi: {
      dos: [
        'Tuân theo lịch trình vận chuyển đã được duyệt',
        'Đi đúng các tuyến đường được chỉ định',
        'Thông báo cho Quản trị viên về sự chậm trễ hoặc sự cố',
        'Ưu tiên an toàn của hành khách',
      ],
      donts: [],
    },
  },
  admin: {
    en: {
      dos: [
        'Manage the transportation schedule',
        'Coordinate vehicle assignments',
        'Handle transportation requests',
        'Communicate schedule updates',
        'Resolve transportation conflicts',
      ],
      donts: [],
    },
    zh: {
      dos: [
        '管理运输时间安排',
        '协调车辆调配',
        '处理用车需求',
        '传达时间安排更新',
        '解决运输冲突',
      ],
      donts: [],
    },
    vi: {
      dos: [
        'Quản lý lịch trình vận chuyển',
        'Điều phối việc phân công xe',
        'Xử lý các yêu cầu đi lại',
        'Thông báo các cập nhật lịch trình',
        'Giải quyết các xung đột vận chuyển',
      ],
      donts: [],
    },
  },
};

export const GUIDE_TITLE_KEY = { employee: 'guide.titleEmployee', driver: 'guide.titleDriver', admin: 'guide.titleAdmin' };
