# Software Requirements Specification (SRS)
## ระบบจองตั๋วภาพยนตร์ออนไลน์ (Online Movie Ticket Booking System)

**Project:** Movie Booking System  
**Version:** 1.0.0  
**Phase:** Requirements Engineering (01-requirements-engineering)  
**Status:** Approved / Ready for System Design  

---

## 1. Problem Statement (คำชี้แจงปัญหา)
- **Pain Points ของลูกค้า:**
  - ต้องเสียเวลาต่อคิวหน้าเคาน์เตอร์โรงภาพยนตร์ โดยเฉพาะช่วงหนังฟอร์มยักษ์เข้าฉาย
  - ไม่สามารถตรวจสอบผังที่นั่งว่างแบบ Real-time ก่อนเดินทางไปโรงภาพยนตร์ได้
  - เสี่ยงต่อการไปถึงโรงภาพยนตร์แล้วที่นั่งเต็มหรือได้ที่นั่งไม่พึงประสงค์
- **Pain Points ของฝ่ายบริหารโรงภาพยนตร์:**
  - ขาดระบบอัตโนมัติในการบริหารจัดการที่นั่งและรอบฉายอย่างมีประสิทธิภาพ
  - ปัญหาการแย่งจองที่นั่งชนกัน (Double Booking / Race Condition) ในช่วงเวลาเร่งด่วน
  - การจัดการรายงานยอดขายและสถิติรอบฉายยังเป็นกระบวนการแมนนวล

---

## 2. Project Scope (ขอบเขตโครงการ)

### 2.1 In-Scope (อยู่ในขอบเขตเวอร์ชัน 1.0)
1. **ระบบสำหรับลูกค้า (Customer Portal):**
   - แสดงรายการภาพยนตร์ (Now Showing / Coming Soon), ข้อมูลภาพยนตร์, เรื่องย่อ, เรตติ้ง, ตัวอย่างหนัง
   - ค้นหาและกรองภาพยนตร์ตามประเภท (Genre), สาขาโรงหนัง, วันที่, และรอบฉาย
   - ผังที่นั่งแบบ Interactive (Visual Seat Map) รองรับที่นั่งหลายระดับ (Standard, Premium, Sofa Bed)
   - ระบบสำรองที่นั่งชั่วคราว (Seat Hold) พร้อมนับเวลาถอยหลัง (Timer 10 นาที) เพื่อป้องกันการจองซ้อน
   - ระบบชำระเงิน (PromptPay QR Code, บัตรเครดิต/เดบิต ผ่าน Payment Gateway Mock/Sandbox)
   - ออกบัตรชมภาพยนตร์อิเล็กทรอนิกส์ (E-Ticket) พร้อม QR Code สำหรับสแกนเข้าโรงภาพยนตร์
   - ดูประวัติการจองตั๋วภาพยนตร์ (Booking History)
2. **ระบบสำหรับผู้ดูแล (Admin / Manager Portal):**
   - จัดการข้อมูลภาพยนตร์ (Movie Management: เพิ่ม/ลบ/แก้ไข)
   - จัดการโรงภาพยนตร์และผังที่นั่ง (Cinema Hall & Seat Layout Config)
   - จัดการตารางรอบฉาย (Showtime Scheduling) พร้อมระบบป้องกันเวลาฉายทับซ้อน
   - Dashboard สรุปยอดขาย, อัตราการครองที่นั่ง (Occupancy Rate) และประวัติการจอง

### 2.2 Out-of-Scope (อยู่นอกขอบเขตเวอร์ชัน 1.0 - วางแผนไว้ใน Phase ถัดไป)
- การสั่งซื้ออาหารและเครื่องดื่ม (F&B / Popcorn Concessions)
- ระบบสมาชิกสะสมคะแนน / บัตร VIP Club Tier
- การเชื่อมต่อฮาร์ดแวร์ตู้จำหน่ายตั๋วอัตโนมัติ (Self-service Kiosk)
- ระบบคืนเงินอัตโนมัติเข้าบัญชีธนาคาร (Refund Automated Processing)

---

## 3. Stakeholder Map (ผู้มีส่วนได้ส่วนเสีย)

| Stakeholder | บทบาทและความรับผิดชอบ | ความต้องการหลัก |
|---|---|---|
| **Moviegoer (ลูกค้าทั่วไป)** | ผู้ใช้งานระบบเพื่อค้นหาและจองตั๋ว | จองง่าย รวดเร็ว เห็นที่นั่งว่างชัดเจน ได้รับตั๋วทันที |
| **Cinema Admin / Manager** | ผู้บริหารจัดการรอบฉายและข้อมูลหนัง | จัดการรอบฉายไม่ให้ชนกัน ติดตามยอดขายได้ Real-time |
| **Theater Staff (พนักงานตรวจตั๋ว)** | พนักงานหน้าทางเข้าโรงภาพยนตร์ | ตรวจสอบความถูกต้องของ E-Ticket QR Code ได้รวดเร็ว |
| **System Operator / DevOps** | ผู้ดูแลเสถียรภาพและความปลอดภัยของระบบ | ระบบไม่ล่ม รองรับ Concurrency สูง ข้อมูลไม่รั่วไหล |

---

## 4. Functional Requirements (ความต้องการเชิงฟังก์ชัน)

| Req ID | หมวดหมู่ | รายละเอียดความต้องการ | ความสำคัญ (MoSCoW) |
|---|---|---|---|
| **FR-01** | Movie Catalog | ระบบต้องแสดงรายการภาพยนตร์ Now Showing และ Coming Soon พร้อมข้อมูลละเอียด (โปสเตอร์, เวลาฉาย, เรตติ้ง, เรื่องย่อ) | Must Have |
| **FR-02** | Showtime & Branch | ลูกค้าสามารถเลือกรอบฉายตามสาขา, วันที่, ภาษาเสียง/ซับไตเติล และประเภทโรงภาพยนตร์ (เช่น Digital, IMAX) ได้ | Must Have |
| **FR-03** | Visual Seat Map | ระบบต้องแสดงผังที่นั่งแบบ Interactive แยกสถานะชัดเจน (ว่าง, ถูกจองแล้ว, กำลังถูกเลือก) พร้อมราคาตามระดับที่นั่ง | Must Have |
| **FR-04** | Temporary Seat Hold | เมื่อลูกค้าเลือกที่นั่งและกดยืนยันขั้นต้น ระบบต้องล็อกที่นั่งไว้ชั่วคราวเป็นเวลา 10 นาที เพื่อไม่ให้ผู้อื่นเลือกซ้ำระหว่างทำธุรกรรม | Must Have |
| **FR-05** | Checkout & Payment | ระบบต้องรองรับการคำนวณราคารวม (รวมภาษี) และเชื่อมต่อ Payment Gateway เพื่อรับชำระเงิน | Must Have |
| **FR-06** | E-Ticket Generation | เมื่อชำระเงินสำเร็จ ระบบต้องสร้าง Booking Reference Code และ E-Ticket พร้อม Dynamic/Signed QR Code ทันที | Must Have |
| **FR-07** | Booking Management | ลูกค้าสามารถค้นหาและตรวจสอบสถานะการจองผ่าน Email/เบอร์โทรศัพท์ หรือหน้าโปรไฟล์ได้ | Should Have |
| **FR-08** | Admin Showtime CRUD | Admin สามารถสร้าง/แก้ไข/ลบรอบฉาย โดยระบบต้องตรวจจับเวลาชนกันของโรงเดียวกันอัตโนมัติ | Must Have |
| **FR-09** | Admin Movie CRUD | Admin สามารถเพิ่ม แก้ไข และปิดการแสดงผลของภาพยนตร์ในระบบได้ | Must Have |
| **FR-10** | Revenue Analytics | Admin สามารถดูรายงานยอดขายรวม, ยอดขายแยกตามเรื่อง, และ Occupancy Rate ได้ | Should Have |

---

## 5. Non-Functional Requirements (NFR)

| NFR ID | มิติคุณภาพ | รายละเอียดข้อกำหนดเชิงเทคนิค |
|---|---|---|
| **NFR-01** | **Concurrency & Consistency** | ระบบต้องจัดการ Race Condition ในการเลือกที่นั่งพร้อมกัน (Concurrency Lock) โดยต้องรับประกันว่าไม่มีการ Double Booking 100% |
| **NFR-02** | **Performance (Latency)** | หน้าเว็บโหลดผังที่นั่งต้องตอบสนองภายใน < 1.5 วินาที ที่ระดับ 500 concurrent users |
| **NFR-03** | **High Availability** | ระบบต้องมี Availability ไม่น้อยกว่า 99.9% ในช่วงเวลาเปิดให้บริการ |
| **NFR-04** | **Data Security & Privacy** | รหัสผ่านต้องถูกเข้ารหัสด้วย Bcrypt/Argon2, ข้อมูลบัตรเครดิตต้องไม่ถูกบันทึกบน Database ตรงตามมาตรฐาน PCI-DSS (ใช้ Tokenization) |
| **NFR-05** | **Responsive Design** | รองรับการแสดงผลทุกขนาดหน้าจอ (Mobile First, Tablet, Desktop) ผังที่นั่งต้องเลื่อนและซูมได้ง่ายบนมือถือ |
| **NFR-06** | **Fault Tolerance** | หากการชำระเงินเกิดข้อผิดพลาดหรือ Time Out ระบบต้อง Rollback คืนสถานะที่นั่ง (Seat Release) โดยอัตโนมัติ |

---

## 6. Business Rules (กฎทางธุรกิจ)

- **BR-01 (Seat Hold Expiration):** การล็อกที่นั่งชั่วคราวมีอายุ 10 นาที หากหมดเวลาโดยยังชำระเงินไม่เสร็จสิ้น ระบบจะคืนสถานะที่นั่งเป็น "ว่าง (Available)" ทันที
- **BR-02 (Single-Seat Orphan Prevention):** ไม่แนะนำให้ปล่อยให้เกิดที่นั่งว่างเดี่ยวตัวเดียวโดดๆ ระหว่างที่นั่งที่ถูกจอง (Orphan Seat Rule) ในแถวเดียวกัน
- **BR-03 (Booking Window):** ปิดรับการจองตั๋วออนไลน์ก่อนรอบภาพยนตร์เริ่มฉาย 15 นาที
- **BR-04 (Maximum Tickets per Order):** จำกัดการจองสูงสุดไม่เกิน 8 ที่นั่ง ต่อ 1 รายการสั่งซื้อ เพื่อป้องกันพฤติกรรมกว้านซื้อตั๋วผี
- **BR-05 (Cancellation & Refund Policy):** ในเวอร์ชัน 1.0 ตั๋วที่ชำระเงินสำเร็จแล้วไม่อนุญาตให้กดยกเลิกผ่านช่องทางออนไลน์ (ต้องติดต่อเคาน์เตอร์บริการลูกค้า)

---

## 7. User Stories & Acceptance Criteria

### US-01: การเลือกที่นั่งและการล็อกที่นั่งชั่วคราว (Seat Selection & Hold)
> **As a** ลูกค้าจองตั๋วภาพยนตร์  
> **I want to** เลือกที่นั่งที่ต้องการบนผังโรงภาพยนตร์ และระบบล็อกที่นั่งไว้ให้ฉันชั่วคราว  
> **So that** ไม่มีผู้อื่นแย่งที่นั่งไปในระหว่างที่ฉันกำลังเตรียมชำระเงิน  

**Acceptance Criteria (Given-When-Then):**
- **AC-01.1 (ล็อกที่นั่งสำเร็จ):**  
  *Given* ลูกค้าอยู่ในหน้าผังที่นั่งของรอบฉายที่ยังไม่เริ่ม  
  *When* เลือกระบุที่นั่งที่ว่างอยู่ (เช่น A1, A2) และกดยืนยันไปหน้าชำระเงิน  
  *Then* สถานะที่นั่ง A1, A2 จะเปลี่ยนเป็น "Held" สำหรับลูกค้ารายนี้ และมีนาฬิกานับถอยหลัง 10:00 นาทีแสดงบนหน้าจอ  
- **AC-01.2 (ป้องกันการจองซ้อน - Race Condition):**  
  *Given* ลูกค้าคนที่ 1 และลูกค้าคนที่ 2 กำลังดูผังที่นั่งเดียวกัน  
  *When* ทั้งสองคนพยายามกดเลือกที่นั่ง A1 ในเสี้ยววินาทีเดียวกัน  
  *Then* คนที่คำสั่งถึงเซิร์ฟเวอร์ก่อนจะได้รับสิทธิ์ Hold ส่วนคนที่สองจะได้รับข้อความแจ้งเตือน "ที่นั่งนี้กำลังถูกทำรายการโดยผู้อื่น" และผังที่นั่งอัปเดตทันที  
- **AC-01.3 (หมดเวลา Hold):**  
  *Given* ลูกค้า Hold ที่นั่งไว้ครบ 10 นาทีแล้วแต่ยังไม่ได้ชำระเงิน  
  *When* นาฬิกานับถอยหลังถึง 00:00  
  *Then* Session การทำรายการจะถูกยกเลิก และที่นั่งจะถูกปลดล็อกกลับเป็น "Available" อัตโนมัติ  

---

### US-02: การชำระเงินและการออก E-Ticket (Payment & E-Ticket)
> **As a** ลูกค้าที่ทำรายการชำระเงิน  
> **I want to** จ่ายเงินผ่าน QR PromptPay หรือบัตร และได้รับ E-Ticket พร้อม QR Code ทันที  
> **So that** ฉันสามารถนำตั๋วไปสแกนเข้าชมภาพยนตร์ได้สะดวก  

**Acceptance Criteria (Given-When-Then):**
- **AC-02.1 (ชำระเงินสำเร็จ):**  
  *Given* ลูกค้ามีสถานะ Hold ที่นั่งที่ยังไม่หมดเวลา  
  *When* สแกนจ่ายผ่าน QR Code หรือกรอกบัตรสำเร็จ และได้รับ Webhook ยืนยันจาก Gateway  
  *Then* สถานะที่นั่งจะเปลี่ยนจาก "Held" เป็น "Booked" อย่างถาวร และระบบแสดงหน้า E-Ticket พร้อม Booking Code และ QR Code  
- **AC-02.2 (ส่งการยืนยัน):**  
  *Given* ระบบสร้าง E-Ticket สำเร็จ  
  *When* บันทึกข้อมูลลงฐานข้อมูลเสร็จสิ้น  
  *Then* ระบบส่งอีเมลยืนยันการจองพร้อมลิงก์เปิด E-Ticket ไปยังอีเมลของลูกค้า  

---

### US-03: การบริหารจัดการรอบฉาย (Showtime Management for Admin)
> **As an** ผู้จัดการโรงภาพยนตร์ (Cinema Admin)  
> **I want to** เพิ่มและจัดการรอบฉายในแต่ละโรงภาพยนตร์  
> **So that** รอบฉายมีความถูกต้อง และไม่มีเวลาฉายชนกันในโรงเดียวกัน  

**Acceptance Criteria (Given-When-Then):**
- **AC-03.1 (สร้างรอบฉายถูกต้อง):**  
  *Given* Admin ระบุภาพยนตร์, โรงภาพยนตร์, วันที่ และเวลาเริ่มฉาย  
  *When* เวลาเริ่มฉายและเวลาฉายสิ้นสุด (บวกเวลาทำความสะอาดโรง 30 นาที) ไม่ทับซ้อนกับรอบฉายอื่นในโรงเดียวกัน  
  *Then* ระบบบันทึกรอบฉายและเปิดให้ลูกค้าเลือกซื้อตั๋วได้  
- **AC-03.2 (แจ้งเตือนรอบฉายทับซ้อน):**  
  *Given* มีรอบฉายภาพยนตร์เรื่อง A ในโรง 1 เวลา 13:00 - 15:30  
  *When* Admin พยายามสร้างรอบฉายเรื่อง B ในโรง 1 เวลา 15:00  
  *Then* ระบบปฏิเสธการบันทึก พร้อมแสดงข้อความเตือน "ช่วงเวลาดังกล่าวทับซ้อนกับรอบฉายอื่นในโรงภาพยนตร์เดียวกัน"  

---

## 8. Requirements Traceability Matrix (RTM)

| Requirement ID | User Story | Component / Subsystem | Test Case Mapping |
|---|---|---|---|
| **FR-01** (Movie Catalog) | Public View | Catalog Service | TC-CAT-01, TC-CAT-02 |
| **FR-02** (Showtime & Branch) | Public View | Showtime Service | TC-SHOW-01, TC-SHOW-02 |
| **FR-03** (Visual Seat Map) | US-01 | Seat Map Service | TC-SEAT-01 |
| **FR-04** (Temporary Seat Hold) | US-01 | Booking & Redis Lock Engine | TC-LOCK-01, TC-RACE-01 |
| **FR-05** (Checkout & Payment) | US-02 | Payment Gateway Adapter | TC-PAY-01, TC-PAY-TIMEOUT |
| **FR-06** (E-Ticket Generation) | US-02 | Ticket Service & QR Engine | TC-TICKET-01, TC-QR-SCAN |
| **FR-07** (Booking History) | US-02 | Order History Service | TC-ORD-01 |
| **FR-08** (Admin Showtime CRUD) | US-03 | Admin Showtime Module | TC-ADMIN-SHOW-01 |
| **FR-09** (Admin Movie CRUD) | Admin View | Admin Movie Module | TC-ADMIN-MOV-01 |
| **FR-10** (Revenue Analytics) | Admin View | Reporting Service | TC-REP-01 |

---

## 9. Assumptions, Constraints, and Technical Risks

### 9.1 Assumptions (ข้อสมมติฐาน)
1. ลูกค้าเข้าถึงระบบผ่าน Web Browser ที่รองรับมาตรฐาน HTML5 / JavaScript สมัยใหม่
2. การชำระเงินทดสอบจะใช้ Mock Payment Gateway หรือ Stripe/Omise Sandbox ที่จำลองสถานะ Success/Fail ได้
3. เวลาฉายของภาพยนตร์แต่ละเรื่องจะถูกคำนวณรวม Buffer ทำความสะอาดโรง 20-30 นาทีเสมอ

### 9.2 Constraints (ข้อจำกัด)
1. การระบุที่นั่งต้องสัมพันธ์กับ Layout เฉพาะของแต่ละโรงภาพยนตร์ (เช่น Standard 10 แถว, Premium 2 แถว)
2. สิทธิ์การเข้าถึงข้อมูลระบบ Admin ต้องมีการยืนยันตัวตน (Authentication & RBAC)

### 9.3 Risks & Mitigation Strategies (ความเสี่ยงและแนวทางรับมือ)
- **Risk 1 (Race Condition ในการจองที่นั่ง):**
  - *Impact:* สูงมาก (ลูกค้าสองคนได้ที่นั่งเดียวกัน เกิดข้อพิพาท)
  - *Mitigation:* ใช้ Distributed Lock (เช่น Redis Lock / Redlock หรือ Optimistic Locking with Versioning ใน Database) พร้อมระดับ Isolation Transaction ที่รัดกุม
- **Risk 2 (Payment Webhook ไม่ถูกเรียก หรือ Network หลุด):**
  - *Impact:* ปานกลาง-สูง (ลูกค้าเงินตัดแล้วแต่ไม่ได้รับตั๋ว)
  - *Mitigation:* มีระบบ Reconciliation Cron Job ตรวจสอบสถานะ Order ที่ค้าง และปุ่ม "ตรวจสอบสถานะการชำระเงิน" ให้ลูกค้ากดเช็คได้เอง
