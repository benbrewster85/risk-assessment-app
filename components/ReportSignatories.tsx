import { ReportSignatory, ReportSignature } from "@/lib/types";

type ReportSignatoriesProps = {
  signatories: ReportSignatory[];
  signatures: ReportSignature[];
};

export default function ReportSignatories({
  signatories,
  signatures,
}: ReportSignatoriesProps) {
  if (signatories.length === 0) {
    return null; // Don't render the section if no one is required to sign
  }

  // Create a quick lookup map of who has signed and when
  const signatureMap = new Map(
    signatures.map((sig) => [sig.profiles?.id, sig.signed_at])
  );

  return (
    <section className="mt-8 break-before-page">
      <h3 className="text-xl font-bold border-b border-gray-400 pb-2 mb-4">
        Sign-off Sheet
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        The following personnel have been briefed on and confirmed their
        understanding of the risks and control measures detailed in this
        document.
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100 print:bg-gray-100">
            <tr>
              <th className="border p-2 font-semibold text-left">Name</th>
              <th className="border p-2 font-semibold text-left">Role</th>
              <th className="border p-2 font-semibold text-left">
                Signature Status
              </th>
              <th className="border p-2 font-semibold text-left">
                Date Signed
              </th>
            </tr>
          </thead>
          <tbody>
            {signatories.map((signatory) => {
              const user = signatory.profiles;
              if (!user) return null;

              const signatureDate = signatureMap.get(user.id);
              const displayName =
                `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                "Unnamed User";

              return (
                <tr key={user.id} className="break-inside-avoid">
                  <td className="border p-2 align-top">{displayName}</td>
                  <td className="border p-2 align-top">{user.role}</td>
                  <td
                    className={`border p-2 align-top font-medium ${signatureDate ? "text-green-700" : "text-yellow-700"}`}
                  >
                    {signatureDate ? "Signed" : "Awaiting Signature"}
                  </td>
                  <td className="border p-2 align-top">
                    {signatureDate
                      ? new Date(signatureDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "---"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
