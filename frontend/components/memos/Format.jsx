"use client"
import { forwardRef, useImperativeHandle, useRef } from "react"

// Lazy-load heavy libs to keep initial bundle small
async function loadPdfDeps() {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf")
  ])
  return { html2canvas, jsPDF }
}

const underscore = "______________"

export const CollectionMemo = forwardRef(function CollectionMemo(
  { data, className, margin = 10 },
  ref
) {
  const containerRef = useRef(null)
console.log(data)
  useImperativeHandle(ref, () => ({
    async download(fileName = "collection-memo.pdf") {
      const el = containerRef.current
      if (!el) return
      const { html2canvas, jsPDF } = await loadPdfDeps()

       const A4_WIDTH_MM = 210
  const A4_HEIGHT_MM = 297
  const PX_TO_MM = 0.264583
  const MM_TO_PX = 3.779528
  const marginMm = margin

  // 1–3px safety so right/left edge पर कट न हो
  const SAFE_PX = 2

  const prevWidth = el.style.width
  const prevBoxSizing = el.style.boxSizing
  const targetContentWidthPx =
    Math.round((A4_WIDTH_MM - marginMm * 2) * MM_TO_PX) - SAFE_PX

  el.style.width = `${targetContentWidthPx}px`
  el.style.boxSizing = "border-box"

  try {
    const canvas = await html2canvas(el, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false
    })

    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" })
    const imgData = canvas.toDataURL("image/png")

    const rawWmm = canvas.width * PX_TO_MM
    const rawHmm = canvas.height * PX_TO_MM
    const maxWmm = A4_WIDTH_MM - marginMm * 2
    const maxHmm = A4_HEIGHT_MM - marginMm * 2
    const fitScale = Math.min(maxWmm / rawWmm, maxHmm / rawHmm, 1)

    const renderWmm = rawWmm * fitScale
    const renderHmm = rawHmm * fitScale
    const x = (A4_WIDTH_MM - renderWmm) / 2
    const y = marginMm

    pdf.addImage(imgData, "PNG", x, y, renderWmm, renderHmm)

    const safeName = (fileName || "collection-memo.pdf").replace(/[/\\:?*"<>|]/g, "-")
    pdf.save(safeName)
  } finally {
    el.style.width = prevWidth
    el.style.boxSizing = prevBoxSizing
  }

    }
  }))

  // Layout mirrors the provided HTML’s wording and structure closely.
  return (
    <div ref={containerRef} className={className}>
<section className="mx-auto w-full max-w-[794px] bg-white text-black border border-black p-3 box-border">
        {/* Header row with names and phone numbers */}
        <div className="text-[11pt] leading-[13pt]">
          <div className="flex items-center justify-between px-1">
            <span>Gopiram</span>
            <span className="font-sans">{"श्री गणेशाय नमः"}</span>
            <span>Mob: 9022223698</span>
          </div>
          <div className="px-1 flex justify-between">
            Mohit <img src="/logo.jpg" className="h-10 mt-1" alt="" /> <span className="ml-10">6375916182</span>
          </div>
        </div>

        {/* Company Name */}
        <h1 className="mt-1 text-center font-bold text-[18pt]">
          Bombay Uttranchal Tempo Service
        </h1>
        <p className="text-center italic font-bold text-[11pt] mt-1">
          Transport Contractor &amp; Commission Agent
        </p>

        {/* Services / Address */}
        <div className="mt-1 text-[11pt]">
          <p className="px-6 text-left font-bold">
            Daily Sservice :{" "}
            <i>Delhi,Haryana, Rajasthan, punjab, UP, UK &amp; All Over India</i>
          </p>
          <p className="text-center font-bold">
            Services :<i>1109,1110,407,20ft,22ft Open &amp; Container etc</i>
          </p>
          <p className="text-center font-bold">
            Add: <i>Building No. C13, Gala No.01, Parasnath Complex,</i>
          </p>
          <p className="text-center">Dapoda, Bhiwandi, Dist. Thane 421302.</p>
        </div>

        {/* Collection memo bar */}
        <div className="mt-2 text-[11pt] leading-[13pt]">
          <div className="flex items-center justify-between pr-3">
            <span>Collection No : {data.collectionNumber || data.collectionNo || "01"}</span>
            <span className="font-bold">COLLECTION MEMO</span>
            <span>Date {data.date || <u>{"          "}</u>}</span>
          </div>
        </div>

        {/* M/s */}
        <div className="mt-1 text-[11pt] leading-[13pt] pl-4">
          <span>M/s. </span>
          <span className="inline-block min-w-[520px]  border-b border-black align-baseline pb-[6px]">
            {data.msName || ""}
          </span>
        </div>

        {/* Dear / Instruction */}
        <div className="mt-1 text-[11pt] leading-[13pt] pl-4">
          <p>Dear Sir,</p>
          <p className="pl-12">
            As Per Your Instruction We Are Sending Herewith Our
          </p>
        </div>

        {/* Lorry / From-To */}
        <div className="mt-2 text-[11pt] leading-[14pt] pl-5 pr-7">
          <p>
            Lorry No{" "}
            <span className="inline-block min-w-[220px] border-b border-black align-baseline pb-[6px]">
              {data.lorryNumber || data.lorryNo || ""}
            </span>{" "}
            For The Collection Of Your Goods To Be Despatched From{" "}
            <span className="inline-block min-w-[160px] border-b border-black align-baseline pb-[6px]">
              {data.from || ""}
            </span>{" "}
            To{" "}
            <span className="inline-block min-w-[160px] border-b border-black align-baseline pb-[6px]">
              {data.to || ""}
            </span>
            .
          </p>
        </div>

        {/* Rate / Fright */}
        <div className="mt-2 text-[11pt] leading-[13pt] pl-5">
          <p className="flex gap-6">
            <span>
              Rate{" "}
              <span className="inline-block min-w-[180px] border-b border-black align-baseline pb-[6px]">
                {data.rate || ""}
              </span>
            </span>
            <span>
              Fright{" "}
              <span className="inline-block min-w-[140px] border-b border-black align-baseline pb-[6px]">
                {data.freight || data.fright || ""}
              </span>
            </span>
          </p>
        </div>

        {/* Weight / Adcance */}
        <div className="mt-1 text-[11pt] leading-[13pt] pl-5">
          <p className="flex gap-6">
            <span>
              Weight{" "}
              <span className="inline-block min-w-[200px] border-b border-black align-baseline pb-[6px]">
                {data.weight || ""}
              </span>
            </span>
            <span>
              Adcance{" "}
              <span className="inline-block min-w-[140px] border-b border-black align-baseline pb-[6px]">
                {data.advance || data.adcance || ""}
              </span>
            </span>
          </p>
        </div>

        {/* Guarantee / Blance */}
        <div className="mt-1 text-[11pt] leading-[13pt] pl-5">
          <p className="flex gap-6">
            <span>
              Guarantee{" "}
              <span className="inline-block min-w-[200px] border-b border-black align-baseline pb-[6px]">
                {data.guarantee || ""}
              </span>
            </span>
            <span>
              Blance{" "}
              <span className="inline-block min-w-[140px] border-b border-black align-baseline pb-[6px]">
                {data.balance || data.blance || ""}
              </span>
            </span>
          </p>
        </div>

        {/* PAN / Faithfully */}
        <div className="mt-3 text-[11pt] leading-[13pt] px-5">
          <div className="flex items-center justify-between">
            <span>PAN CARD No. BDJPK0529D</span>
            <span className="font-bold">Your&apos;s Faithfully</span>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-2 text-[11pt] leading-[13pt] px-5">
          <p>TERMS :</p>
          <p>* We are not responsible for leakage</p>
          <p className="pl-7">Breakage &amp; consquent damages in Transit.</p>
          <p>* Goods carried at Owner&apos;s Risk</p>
          <p>
            * Pleased check lorry engine, chases and all necessary documents.
          </p>
        </div>

        {/* Bank */}
        <div className="mt-1 text-[11pt] leading-[13pt] px-5">
          <p className="font-bold">HDFC - A/c. 50200006579916</p>
          <p className="font-bold">IFSC HDFC - 0009218 - Mankoli Branch</p>
        </div>

        {/* Footer */}
        <div className="mt-3 text-[11pt] leading-[13pt] text-right pr-5">
          For Bombay Uttranchal Tempo Service
        </div>
      </section>
    </div>
  )
})
