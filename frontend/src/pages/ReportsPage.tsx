import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "../app/api";
import { Button, Card, LoadingState } from "../components/ui";

const schema = z.object({
  reportType: z.enum(["developer", "repository", "organization", "weekly", "monthly", "executive"]),
  format: z.enum(["pdf", "excel", "csv"])
});

type FormValues = z.infer<typeof schema>;
type ReportHistory = Array<{ id: string; reportType: string; format: string; status: string; fileLocation?: string; requestedAt: string }>;

export function ReportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["reports"], queryFn: () => api<ReportHistory>("/reports/history") });
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { reportType: "weekly", format: "pdf" } });
  const createReport = useMutation({ mutationFn: (values: FormValues) => api(`/reports/${values.format}`, { method: "POST", body: JSON.stringify({ reportType: values.reportType }) }) });
  if (isLoading || !data) return <LoadingState label="Loading reports" />;

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Reports</h1>
          <p>Generate developer, repository, organization, weekly, monthly, and executive exports.</p>
        </div>
      </div>
      <div className="grid two">
        <Card title="Generate Report">
          <form className="form" onSubmit={handleSubmit((values) => createReport.mutate(values))}>
            <label>Report type<select {...register("reportType")}><option value="developer">Developer</option><option value="repository">Repository</option><option value="organization">Organization</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="executive">Executive</option></select></label>
            <label>Format<select {...register("format")}><option value="pdf">PDF</option><option value="excel">Excel</option><option value="csv">CSV</option></select></label>
            {errors.reportType && <small>{errors.reportType.message}</small>}
            <Button type="submit">
              <Download size={16} /> Queue Report
            </Button>
            {createReport.isSuccess && <p className="success">Report generation queued.</p>}
          </form>
        </Card>
        <Card title="Report History">
          <div className="list">
            {data.map((report) => (
              <div key={report.id} className="list-row">
                <strong>{report.reportType} · {report.format}</strong>
                <span>{report.status} · {new Date(report.requestedAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
