Dưới đây là bản mô tả yêu cầu nghiệp vụ (BRD / Functional Requirement) đủ chi tiết để gửi cho developer thiết kế và lập trình MVP Office Car Booking App.

Office Car Booking Management System
1. Mục tiêu

Xây dựng một ứng dụng nội bộ đơn giản giúp:

Nhân viên tự kiểm tra lịch xe trống và đặt xe.
Tránh tình trạng đặt trùng xe.
Admin dễ dàng quản lý lịch xe.
Manager có dashboard trực quan để theo dõi tình trạng sử dụng xe.
Hỗ trợ xuất báo cáo Excel để tổng hợp dữ liệu vận hành.
2. User Roles
Employee

Có thể:

Xem lịch xe còn trống
Tạo booking
Xem booking của bản thân
Hủy booking (trước giờ sử dụng)
Admin

Có thể:

Quản lý xe
Quản lý booking
Chỉnh sửa booking
Hủy booking
Xem dashboard
Export Excel
Manager

Có thể:

Xem dashboard
Xem lịch sử sử dụng xe
Xem tỷ lệ sử dụng xe

Không được chỉnh sửa booking.

3. Vehicle Information

Mỗi xe gồm:

Field	Description
Vehicle ID	Auto generate
License Plate	Biển số
Vehicle Name	Xe Innova 01
Capacity	7 seats
Status	Active / Maintenance
Driver Name	Tài xế phụ trách
Notes	Ghi chú
4. Booking Logic
Time Slot Rule

Hệ thống hoạt động theo slot cố định.

Ví dụ:

Slot
08:00 - 10:00
10:30 - 12:30
13:00 - 15:00
15:30 - 17:30
18:00 - 20:00

Nguyên tắc:

Mỗi slot = 2 giờ
Buffer giữa các slot = 30 phút
Không cho đặt ngoài slot chuẩn
Auto Hide Booked Slot

Khi slot đã được booking:

Slot đó biến mất khỏi màn hình đặt xe
Người dùng khác không nhìn thấy slot đó nữa

Ví dụ:

Xe A

08:00-10:00 → Đã đặt

Màn hình chỉ hiện:

10:30-12:30
13:00-15:00
15:30-17:30
Auto Hide Fully Booked Day

Nếu tất cả slot của tất cả xe trong ngày đã được đặt:

Ngày đó sẽ:

Mờ đi (disabled)
Hoặc ẩn hoàn toàn khỏi calendar

Mục tiêu:

Người dùng nhìn lịch sẽ chỉ thấy những ngày còn khả năng đặt.

5. Booking Form
Input

Employee chọn:

Field
Date
Vehicle
Time Slot
Destination
Purpose
Number of Passengers
Requester Name
Department
Contact Number
Auto Generated
Field
Booking ID
Booking Time
Booking Status
Status
Pending
Approved
Rejected
Completed
Cancelled

(Có thể bỏ bước Approve nếu muốn đơn giản)

6. Calendar View
Employee View

Calendar đơn giản:

Chỉ hiện ngày còn slot
Click ngày
Hiện xe còn trống
Hiện slot còn trống

Flow:

Date
→ Vehicle
→ Slot
→ Submit

Admin View

Calendar đầy đủ.

Màu sắc:

Green = Available

Blue = Booked

Grey = Completed

Red = Cancelled

Orange = Maintenance

7. Dashboard
Summary Cards

Hiển thị:

Total Vehicles

Ví dụ:

3 Vehicles

Today's Bookings

Ví dụ:

12 Bookings

Utilization Rate

Ví dụ:

85%

Công thức:

Booked Slots / Total Slots

Most Used Vehicle

Ví dụ:

Innova 01

8. Dashboard Charts
Booking Trend

Theo:

Day
Week
Month
Vehicle Utilization
Vehicle	Usage %
Innova 01	92%
Innova 02	75%
Fortuner	68%
Peak Booking Hours

Thống kê:

Slot nào được đặt nhiều nhất

Ví dụ:

10:30-12:30

9. Excel Export

Admin có thể export:

Booking Summary
Date	Vehicle	User	Department	Destination	Purpose	Slot	Status
Vehicle Utilization Report
Vehicle	Total Slots	Used Slots	Utilization %
Monthly Report
Month	Total Booking	Total Hours
10. Notification
Booking Success

Email hoặc Teams Notification:

"Your vehicle booking has been confirmed."

Booking Cancellation

"Your booking has been cancelled."

Upcoming Reminder

30 phút trước giờ khởi hành:

"Your booked vehicle will start in 30 minutes."

11. Search & Filter

Admin có thể lọc:

Date
Vehicle
Department
Employee
Status
12. Suggested Database Structure
Vehicles
vehicle_id
license_plate
vehicle_name
capacity
driver_name
status
created_at
Bookings
booking_id
vehicle_id
employee_name
department
contact_number
destination
purpose
passenger_count
booking_date
slot_start
slot_end
status
created_at
Users
user_id
name
email
department
role
13. Recommended MVP Tech Scope

Frontend:

React
Ant Design

Backend:

NodeJS Express

Database:

MySQL

Hosting:

Internal Server hoặc Azure

Export:

Excel (.xlsx)
