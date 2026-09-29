# Flood Survival

เว็บเกม/interactive chronicle สำหรับถ่ายทอดเหตุการณ์น้ำท่วมจริงในพื้นที่ **คลองประเวศบุรีรมย์** ในรูปแบบ isometric 3D แบบ mobile-first

## Runtime

- **PlayCanvas Engine 2.22.6**
- Static ES modules + import map
- No build step required for MVP
- GitHub Pages ready

PlayCanvas เป็น runtime หลักของฉาก 3D ส่วน HUD / timeline / provenance ใช้ DOM เพื่อให้ข้อความภาษาไทยอ่านง่ายและรองรับ accessibility

## MVP

- Isometric 3D flood scene
- Timeline 23–29 ก.ย. 2569
- DAY 2 / 03:00 field report: ตื่นชั้น 1 และพบน้ำราวครึ่งเตียง
- NOW field report: ในบ้านประมาณเข่า / รอบบ้านบางจุดเอว–อก
- ระดับน้ำและฝนในฉากเปลี่ยนตาม timeline แต่ติดป้าย reconstructed ชัดเจน
- Tonight survival missions บันทึกสถานะใน localStorage
- Provenance: OFFICIAL / REPORTED / FIELD REPORT / ESTIMATE / SIMULATION
- Fact-check lock: ห้ามอ้าง “น้ำเหนือทำให้คลองประเวศระบายช้า” เป็นข้อเท็จจริงหากไม่มีข้อมูลปัจจุบันยืนยัน
- Mobile-first UI
- GitHub Pages workflow

## Safety rule

ฉาก 3D เป็น **RECONSTRUCTED VISUALIZATION** ไม่ใช่แบบจำลองชลศาสตร์ ไม่ใช่ค่าระดับน้ำจาก sensor และไม่ใช่ forecast

เกมไม่มีภารกิจที่ชักจูงให้ลุยน้ำ เข้าใกล้ไฟฟ้า หรือเสี่ยงอันตรายเพื่อคะแนน

## Local run

```bash
python -m http.server 8080
```

เปิด `http://localhost:8080`

## Deploy

เมื่อ merge เข้า `main` workflow `.github/workflows/pages.yml` จะ deploy static site ไป GitHub Pages

## Next

1. เพิ่ม topology คลอง/สถานีสูบ/ประตูน้ำจากแหล่งทางการ
2. เพิ่ม official live-data adapters พร้อม provenance + timestamp
3. เพิ่ม community report แบบลดความละเอียดพิกัด
4. เพิ่ม Emergency Mode ที่ลด game UI และยกข้อมูลทางการขึ้นก่อน
5. ทำ low-poly PlayCanvas asset pass ให้สะท้อนสภาพชุมชนจริงมากขึ้น
