import React from "react";
import { format } from "date-fns";
import { ImageIcon, Printer, X } from "lucide-react";
import Image from "next/image";

// --- INTERFACE (Tidak ada perubahan) ---
type ReportStatus = "Progress" | "Pending" | "Completed";

interface Employee {
  id: number;
  user_id: number;
  division_id: number;
  position_id: number;
  region: string;
  employee_number: string;
  nik: string;
  name: string;
  gender: string;
  place_of_birth: string;
  date_of_birth: string;
  phone_number: string;
  email: string;
  address: string;
  status: string;
  date_of_entry: string;
  is_active: number;
  photo: string;
}

interface TypeOfHealthFacility {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface MedicalDevice {
  id: number;
  medical_device_category_id: number;
  brand: string;
  model: string;
  serial_number: string;
  software_version: string;
  status: string;
  notes: string | null;
  pivot: {
    health_facility_id: number;
    medical_device_id: number;
  };
}

interface HealthFacility {
  id: number;
  type_of_health_facility_id: number;
  name: string;
  slug: string;
  email: string;
  phone_number: string;
  city: string;
  address: string;
  lat: string | null;
  lng: string | null;
  type: TypeOfHealthFacility;
  medical_devices: MedicalDevice[];
}

interface TypeOfWork {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

interface ReportWorkItemType {
  id: number;
  report_work_item_id: number;
  type_of_work_id: number;
  type_of_work: TypeOfWork;
}

interface PartImage {
  id: number;
  image: string;
  description: string;
}

interface PartUsedForRepair {
  id: number;
  uraian: string;
  quantity: string;
  images: PartImage[];
}

interface Parameter {
  id: number;
  name: string;
  uraian: string;
  description: string;
}

interface ReportWorkItem {
  id: number;
  report_id: number;
  medical_device_id: number;
  problem: string;
  error_code: string;
  job_action: string;
  completion_status_id: number;
  completed_at: string;
  total_time: string;
  note: string;
  job_order: string;
  report_work_item_type: ReportWorkItemType[];
  part_used_for_repair: PartUsedForRepair[];
  parameter: Parameter[];
}

interface Location {
  id: number;
  report_id: number;
  latitude: string;
  longitude: string;
  address: string;
}

interface Report {
  id: number;
  user_id: number;
  employee_id: number;
  health_facility_id: number;
  report_number: string;
  is_status: ReportStatus;
  customer_name: string;
  customer_phone: string;
  note: string | null;
  suggestion: string;
  attendance_customer: string;
  attendance_employee: string;
  completed_at: string;
  total_time: string;
  employee: Employee;
  health_facility: HealthFacility;
  report_work_item: ReportWorkItem[];
  location: Location;
}

interface PrintLayoutProps {
  report: Report;
  onClose: () => void;
}

// --- FUNGSI BANTU & KOMPONEN KECIL (Tidak ada perubahan) ---
const safeFormatDate = (
  dateString: string | null | undefined,
  fallback: string
) => {
  if (dateString && !isNaN(new Date(dateString).getTime())) {
    return format(new Date(dateString), "dd MMMM yyyy");
  }
  return fallback;
};

const PartImageBox = ({
  image,
  onImageClick,
}: {
  image: PartImage;
  onImageClick: (url: string, description: string) => void;
}) => {
  const baseStorageUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL;
  const fullImageUrl = image.image
    ? `${baseStorageUrl}/parts_used_images/${image.image}`
    : null;

  const handleClick = () => {
    if (fullImageUrl) {
      onImageClick(fullImageUrl, image.description || "Part image");
    }
  };

  return (
    <div
      className="relative w-[200px] h-[250px] rounded-lg border overflow-hidden cursor-pointer group"
      onClick={handleClick}
    >
      {/* Gambar atau Placeholder */}
      {fullImageUrl ? (
        <Image
          src={fullImageUrl}
          alt={image.description || "Part image"}
          fill
          style={{ objectFit: "cover" }} // Menggunakan 'cover' agar gambar memenuhi area
          className="transition-transform duration-300 group-hover:scale-110" // Efek zoom saat hover
          onError={(e) => {
            console.error("Failed to load part image:", fullImageUrl);
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = "none";

            // Menampilkan placeholder jika gambar error
            const parent = target.parentElement;
            if (parent) {
              const placeholder = parent.querySelector(".placeholder-icon");
              if (placeholder) {
                (placeholder as HTMLElement).style.display = "flex";
              }
            }
          }}
        />
      ) : null}

      {/* Placeholder Icon (ditampilkan jika tidak ada gambar atau saat error) */}
      <div
        className={`placeholder-icon w-full h-full items-center justify-center bg-gray-100 ${
          fullImageUrl ? "hidden" : "flex"
        }`}
      >
        <ImageIcon className="w-10 h-10 text-gray-400" />
      </div>

      {/* Deskripsi sebagai Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-60 text-center">
        <p className="text-xs text-white truncate">
          {image.description || "No description"}
        </p>
      </div>
    </div>
  );
};

const SignatureBox = ({
  title,
  url,
}: {
  title: string;
  url: string | null;
}) => {
  const baseStorageUrl = process.env.NEXT_PUBLIC_FILE_BASE_URL;
  let fullImageUrl = null;

  if (url) {
    let folderPath = "";
    if (url.includes("customer_signature")) {
      folderPath = "signatures/customer_signatures";
    } else if (url.includes("employee_signature")) {
      folderPath = "signatures/employee_signatures";
    } else {
      folderPath = "signatures";
    }
    fullImageUrl = `${baseStorageUrl}/${folderPath}/${url}`;
  }

  return (
    <div className="p-4 rounded-lg text-center flex flex-col">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="relative flex-grow w-full h-24 rounded-md">
        {fullImageUrl ? (
          <Image
            src={fullImageUrl}
            alt={`${title}`}
            fill
            style={{ objectFit: "contain" }}
            className="bg-white rounded-md p-1"
            onError={(e) => {
              console.error("Failed to load image:", fullImageUrl);
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                const placeholder = parent.querySelector(".placeholder-icon");
                if (placeholder)
                  (placeholder as HTMLElement).style.display = "flex";
              }
            }}
          />
        ) : null}
        <div
          className={`w-full h-full flex items-center justify-center placeholder-icon ${
            fullImageUrl ? "hidden" : ""
          }`}
        >
          <ImageIcon className="w-8 h-8 text-gray-500" />
        </div>
      </div>
    </div>
  );
};

// --- PEMBARUAN DI SINI: KOMPONEN BARU UNTUK DETAIL SETIAP PEKERJAAN ---
interface WorkItemDetailsProps {
  report: Report;
  workItem: ReportWorkItem;
  index: number;
}

const WorkItemDetails: React.FC<WorkItemDetailsProps> = ({
  report,
  workItem,
  index,
}) => {
  const device = report?.health_facility?.medical_devices?.find(
    (d) => d.id === workItem.medical_device_id
  );

  const completionDate = safeFormatDate(workItem?.completed_at, "In Progress");
  const typesOfWork =
    workItem?.report_work_item_type
      ?.map((item) => item.type_of_work.name)
      .join(", ") || "-";

  return (
    <section className="space-y-4 print-section break-after-page">
      {/* -- Judul untuk setiap item pekerjaan -- */}
      <div className="pt-6 pb-2 mb-4 border-b-2 border-gray-400 border-dashed">
        <h3 className="text-xl font-bold text-gray-800">
          Service Details #{index + 1}
        </h3>
      </div>

      {/* -- Detail Perangkat -- */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-lg font-semibold text-gray-950 border-b border-gray-200 pb-2 mb-3">
          Device Details
        </h3>
        <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
          <p className="text-gray-950">
            <span className="font-semibold">Brand:</span> {device?.brand ?? "-"}
          </p>
          <p className="text-gray-950">
            <span className="font-semibold">Model/Type:</span>{" "}
            {device?.model ?? "-"}
          </p>
          <p className="text-gray-950">
            <span className="font-semibold">Serial Number:</span>{" "}
            {device?.serial_number ?? "-"}
          </p>
          <p className="text-gray-950">
            <span className="font-semibold">Software Version:</span>{" "}
            {device?.software_version ?? "N/A"}
          </p>
          <div className="col-span-2">
            <p className="text-gray-950">
              <span className="font-semibold">Status:</span>{" "}
              {device?.status ?? "-"}
            </p>
          </div>
        </div>
      </div>

      {/* -- Detail Pekerjaan -- */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-gray-100 p-3 rounded-lg">
          <p className="text-sm font-semibold text-gray-950">Completion Date</p>
          <p className="font-medium text-gray-800">{completionDate}</p>
        </div>
        <div className="bg-gray-100 p-3 rounded-lg">
          <p className="text-sm font-semibold text-gray-950">Job Order</p>
          <p className="font-medium text-gray-800">
            {workItem?.job_order ?? "-"}
          </p>
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-gray-950">Type of Work:</h4>
        <p className="text-gray-950 mt-1 p-3 bg-gray-100 rounded-md">
          {typesOfWork}
        </p>
      </div>
      <div>
        <h4 className="font-semibold text-gray-950">Problem / Complaint:</h4>
        <p className="text-gray-950 mt-1 p-3 bg-gray-100 rounded-md">
          {workItem?.problem ?? "-"}
        </p>
      </div>
      <div>
        <h4 className="font-semibold text-gray-950">Error Code:</h4>
        <p className="text-gray-950 font-mono mt-1 p-3 bg-gray-100 rounded-md">
          {workItem?.error_code ?? "-"}
        </p>
      </div>
      <div>
        <h4 className="font-semibold text-gray-950">Action Taken:</h4>
        <p className="text-gray-950 mt-1 p-3 bg-gray-100 rounded-md whitespace-pre-wrap">
          {workItem?.job_action ?? "-"}
        </p>
      </div>

      {/* -- Tabel Parameter -- */}
      {workItem.parameter && workItem.parameter.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-950">Parameters:</h4>
          <div className="mt-1 border border-gray-200 rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2 font-semibold text-gray-950">Parameter</th>
                  <th className="p-2 font-semibold text-gray-950">
                    Uraian
                  </th>
                  <th className="p-2 font-semibold text-gray-950">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-950">
                {workItem.parameter.map((param) => (
                  <tr key={param.id}>
                    <td className="p-2 w-1/3 text-gray-950">{param.name}</td>
                    <td className="p-2 text-gray-950">{param.uraian}</td>
                    <td className="p-2 text-gray-950">{param.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -- Suku Cadang yang Digunakan -- */}
      {workItem.part_used_for_repair &&
        workItem.part_used_for_repair.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-950">
              Parts Used for Repair:
            </h4>
            <div className="space-y-4 mt-2">
              {workItem.part_used_for_repair.map((part) => (
                <div key={part.id} className="p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b">
                    <p className="font-medium">{part.uraian}</p>
                    <p className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                      Qty: {part.quantity}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {part.images.map((img) => (
                      <PartImageBox
                        key={img.id}
                        image={img}
                        onImageClick={() => {}}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      <div>
        <h4 className="font-semibold text-gray-950">Work Item Note:</h4>
        <p className="text-gray-950 mt-1 p-3 bg-gray-100 rounded-md">
          {workItem?.note ?? "-"}
        </p>
      </div>
    </section>
  );
};

// --- PEMBARUAN DI SINI: PRINTCONTENT SEKARANG MELAKUKAN LOOPING ---
const PrintContent: React.FC<{ report: Report }> = ({ report }) => {
  const reportDate = safeFormatDate(report?.completed_at, "-");

  return (
    <div className="a4-paper space-y-6">
      {/* Header */}
      <header className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
        <div className="w-full">
          <h1 className="text-2xl font-bold text-gray-800">SERVICE REPORT</h1>
          <p className="text-gray-500 font-mono">{report.report_number}</p>
        </div>
        <div className="text-right">
          <h2 className="text-1xl font-bold text-red-600">
            PT. Anugerah Rezeki Bersama Indonesia
          </h2>
          <p className="text-sm text-gray-600">
            Jl. Setia Luhur Kompleks Setia Luhur Businness Center No 1-3 Medan,
            Sumatera Utara, Indonesia.
          </p>
          <p className="text-sm text-gray-600">arbimarketingteam@gmail.com</p>
        </div>
      </header>

      <main className="space-y-6">
        {/* -- Informasi Umum Laporan -- */}
        <section className="print-section grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Customer
            </h3>
            <div className="pl-3 border-l-2 border-gray-200">
              <p className="text-gray-950 font-semibold text-lg">
                {report?.health_facility?.name}
              </p>
              <p className="text-sm text-gray-950">
                {report?.health_facility?.address},{" "}
                {report?.health_facility?.city}
              </p>
              <p className="text-sm text-gray-950">
                Contact: {report?.customer_name} ({report.customer_phone})
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Technician
            </h3>
            <div className="pl-3 border-l-2 border-gray-200">
              <p className="text-gray-950 font-semibold text-lg">
                {report?.employee?.name}
              </p>
              <p className="text-sm text-gray-950">
                Employee ID: {report.employee.employee_number}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 p-3 rounded-lg text-center">
            <p className="text-sm font-semibold text-gray-950">Report Date</p>
            <p className="font-medium text-gray-800">{reportDate}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-lg text-center">
            <p className="text-sm font-semibold text-green-700">
              Overall Status
            </p>
            <p className="font-bold text-green-800 uppercase">
              {report.is_status}
            </p>
          </div>
        </section>

        {/* -- LOOPING UNTUK SETIAP ITEM PEKERJAAN -- */}
        {report.report_work_item?.map((workItem, index) => (
          <WorkItemDetails
            key={workItem.id}
            report={report}
            workItem={workItem}
            index={index}
          />
        ))}

        {/* -- Saran Umum & Catatan -- */}
        <section className="space-y-4 pt-6 border-t border-gray-200">
          <div>
            <h4 className="font-semibold text-gray-950">
              Note:
            </h4>
            <p className="text-gray-950 mt-1 p-3 bg-gray-100 rounded-md">
              {report.note ?? "-"}
            </p>
          </div>
        </section>
        <section className="space-y-4 pt-6 border-t border-gray-200">
          <div>
            <h4 className="font-semibold text-gray-950">
              Suggestion / Recommendation:
            </h4>
            <p className="text-gray-950 mt-1 p-3 bg-gray-100 rounded-md">
              {report.suggestion ?? "-"}
            </p>
          </div>
        </section>
      </main>

      {/* Footer dengan Tanda Tangan */}
      <footer className="pt-8 border-t border-gray-200 mt-10">
        <div className="grid grid-cols-2 gap-8 text-center">
          <div>
            <p className="mb-4 text-sm text-gray-950">Technician Signature,</p>
            <SignatureBox title="" url={report.attendance_employee} />
            <p className="text-gray-950 font-semibold border-t border-gray-300 pt-2 mt-2">
              {report?.employee?.name}
            </p>
          </div>
          <div>
            <p className="mb-4 text-sm text-gray-950">Customer Signature,</p>
            <SignatureBox title="" url={report.attendance_customer} />
            <p className="text-gray-950 font-semibold border-t border-gray-300 pt-2 mt-2">
              {report.customer_name}
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-gray-950 mt-8">
          This is a system-generated document.
        </p>
      </footer>
    </div>
  );
};

// --- KOMPONEN UTAMA PRINTLAYOUT (Tidak ada perubahan) ---
const PrintLayout: React.FC<PrintLayoutProps> = ({ report, onClose }) => {
  const handlePrint = () => {
    const printContent = document.querySelector(".print-only");
    if (!printContent) {
      console.error("Elemen .print-only tidak ditemukan!");
      return;
    }
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-start z-50 p-4 overflow-y-auto non-printable">
      <div className="print-only absolute top-0 left-0 w-full bg-white">
        <PrintContent report={report} />
      </div>

      <div className="relative bg-gray-200 rounded-lg shadow-2xl w-full max-w-5xl my-8">
        <div className="print-controls sticky top-0 bg-gray-800 p-3 flex justify-between items-center z-10 rounded-t-lg">
          <span className="font-semibold text-white">Print Preview</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Now
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-600 text-white hover:bg-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div
            className="bg-white shadow-lg mx-auto"
            style={{ width: "210mm", minHeight: "297mm" }}
          >
            <div className="p-12">
              <PrintContent report={report} />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .non-printable {
            display: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-only {
            display: block !important;
            position: static;
          }
          .print-section {
            break-inside: avoid;
          }
          .break-after-page {
            break-after: page;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default PrintLayout;
