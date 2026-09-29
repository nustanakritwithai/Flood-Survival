# Flood Survival

เว็บเกม/interactive chronicle สำหรับถ่ายทอดเหตุการณ์น้ำท่วมจริงในพื้นที่ **คลองประเวศบุรีรมย์** ในรูปแบบ isometric 3D แบบ mobile-first

## Runtime

- **PlayCanvas Engine 2.22.6**
- Static ES modules + import map
- No build step required
- GitHub Pages deployment

PlayCanvas เป็น runtime หลักของฉาก 3D ส่วน HUD / timeline / provenance ใช้ DOM เพื่อให้ข้อความภาษาไทยอ่านง่ายและรองรับ accessibility

## v0.2 — Safe Interaction Pass

- ปรับบ้านหลักเป็น cutaway 2 ชั้น
- เพิ่มคลอง ถนน สะพาน ประตูระบายน้ำ ไฟถนน ต้นไม้ และเศษของลอย
- ตัวละครเปลี่ยนตำแหน่งตาม Timeline
- ในโหมด NOW ตัวละครเดินได้เฉพาะ **safe nodes บนพื้นที่ยกสูง**
- 6 safe nodes: ไฟฟ้า / ของจำเป็น / การสื่อสาร / ทางขึ้นที่สูง / จุดสังเกตน้ำ / แผนฉุกเฉิน
- จุดภารกิจ 3D ถูก anchor เป็น DOM buttons เพื่อให้แตะง่ายบนมือถือและใช้กับ accessibility ได้
- Mission completion บันทึกใน localStorage
- Replay วันเก่าปิด gameplay interactions และทำหน้าที่เป็น reconstructed chronicle เท่านั้น

## Event baseline

- Timeline 23–29 ก.ย. 2569
- 26 ก.ย. 03:00 FIELD REPORT: ตื่นชั้น 1 และพบน้ำราวครึ่งเตียง
- 29 ก.ย. FIELD REPORT: ในบ้านประมาณเข่า / รอบบ้านบางจุดเอว–อก
- Provenance: OFFICIAL / REPORTED / FIELD REPORT / ESTIMATE / SIMULATION
- Fact-check lock: ห้ามอ้าง “น้ำเหนือทำให้คลองประเวศระบายช้า” เป็นข้อเท็จจริงหากไม่มีข้อมูลปัจจุบันยืนยัน

## Safety rule

ฉาก 3D เป็น **RECONSTRUCTED VISUALIZATION** ไม่ใช่แบบจำลองชลศาสตร์ ไม่ใช่ค่าระดับน้ำจาก sensor และไม่ใช่ forecast

เกมไม่มีภารกิจที่ชักจูงให้ลุยน้ำ เข้าใกล้ไฟฟ้า หรือเสี่ยงอันตรายเพื่อคะแนน

## Local run

```bash
python -m http.server 8080
```

เปิด `http://localhost:8080`

## Verify

```bash
npm run verify
```

## Next

1. ผูก topology คลอง/สถานีสูบ/ประตูน้ำกับแหล่งทางการ
2. เพิ่ม official live-data adapters พร้อม provenance + timestamp
3. เพิ่ม community report แบบลดความละเอียดพิกัด
4. เพิ่ม Emergency Mode ที่ยกข้อมูลทางการขึ้นก่อนและลดองค์ประกอบเกม
5. ทำ low-poly asset pass เพิ่ม เช่น เรือช่วยเหลือ ป้ายระดับน้ำ ร้าน/จุดแจกของ และ landmark ที่ยืนยันจากพื้นที่จริง
