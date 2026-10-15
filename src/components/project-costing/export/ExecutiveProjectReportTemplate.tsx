import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ProjectCostingProject } from "@/types/projectCosting";

export interface ExecutiveProjectReportTemplateProps {
  project?: ProjectCostingProject;
  transactions?: any[];
  parsedPhases?: any[];
  budgetAdjustments?: any[];
  budgetNum?: number;
  actualSpend?: number;
  committedSpend?: number;
  lineChartData?: any[];
  pieChartData?: any[];
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyLogo?: string;
  projectManagerName?: string;
}

export const FASTRASUITE_LOGO_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHoAAAAoCAYAAAAxH+4YAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAABRrSURBVHgB7VsJeBRVtr5V1Vs66SydjWwkbAHZArIbEFCZGVF5uKDz+MANcXAZP3XmOU/FMSr6FFFmwNHhDaiDCyOLO+6+QRkjICCbYBKWQDp76HS602t1Vb3/dFfFpulIEmPynni+73ZV3brLuWe755xbzRU/cLKS/fjAUeF1ptqGfRtXlW267nk88yiKWroCOpSg2WzOjouLu99kMk1SFCUBdU5RFPc1NjbejnsP+xlCwIHRXSV0pwGMUEzJiZwpRV/+3gJuMAszW2adBwFFSk9PvyohIWEDGMtkWaZ1cJiCGY1G2e12J4HZraz3INbaSOB7jN4sCpkeAw7gb3EGXVXOwhkrfZ+yMCE41nmQ0tLSConJPp9PAog0tk6nY1QCgcBbKpO7MnZ3gWy1WnNTU1P/LSkpaQaE8lesh+kdCb0wMaeTg6LEC8YLBs55fijrooQbDIaVfr+fhEcRBEEPTf7A6XROB+MfCwaDy9RmvaI9Guj1+vkQxjcTExM/QnkfzI5jvQQ61hvAcYKv2cMsfUZegaeDrPPAg9GjoLm0G+jA6J02m+1i9d0W9Rraw1kvAizNSRTaVhiELwBr05VtqlsgrNFKz0s+J+iZ7Ky3sq6BAcQj7QiZ65aWlpe1YSPaRDO5PTPem+b9TMCd4bnDwOv1ZpvC5J5erMLJIhNT8vd1oo8+4t6HItENTDddHNq4EW2EiKvmBBnj4+Mz4aXnwaRmsLDWK1Hto6GtPisry6x6+XnJgIg2vDqHVsIdBaE+oo1cW1sbHQUYWGyrqtdwzszMjEdE0U+dT1H7nDIPvQNOuSg58AsSY+DFdE0nW55LTzc/KvpFSWl/sd0KctCvWLKsyv5tmzexjnuiIhb9KDR5JM/zLlzjqZJMI7zsO7H/TcFjAjQ8y+v13ulwOL5mqncOOhSBCMvQbrzajwggwVFywvx/hXLXyZMnD7HTzX3oGWNPxlbxFPbc4XACTSzsV4oQlhPou6yhoWEV+y5cjIdAbICprgeeQykKIMCzHvi/gmeKDBKB514w/n56Z7FYiiGAtLZm1DfV1NQszM3NJYu1FsJyCfCOw1XC9Yn6+vr7NdwyMjIeAA43YGwSWoMq9H44fzZYuWfsdvuf1bZ8SDJmrlFOtFQ25eJZYj8us7HGoGLJSecbD31zze4VI9azToQcWDwxYwjdq+EUDSiBoDp1kaRFzOVyXYVFkhCxnJycF8Gk68CQUHjHIjQBjzL60n5Pnvofq6urH2HfMTskJPn5+atxXUAhHPXntIlYiNsKunOYs6KyspLCRQVMS4NWNZIA0nTAM0gBgTZXBJ7lx48fpz4M7Reg32rqg/cVuB+O8JDyAUaVNqEtCuua19zc/AoE6Rxo+ddgsBHlFJy0paE9B8G0wWEthP/iC+3R8R9sKEgoSNsNLRMMBh0ZdOyhhu4tQMWcbuUSszNYa23dPJXJkabzjADkSbIZ6KUxjQgj0zq1erpigXpVMEpRdx0W6wl5bVg83lehbifuG1B4MEKCpx5E3cPQuGtUJhPhKE6/Dt2IyQHCEwJB/b9B2a9OwYE5Xrwf1Ldv33J1PaEQj/DQ8NOIr+FHV5S2rQjM8qpCQRbKC4ZWEJNpXZiHGEZjymDyeuA4HNvHQeCsQ1ty8EgIPBjvaxIempumxZg+WDYoLzsQYjxVbthwtcw2sDEDL35udNyQK69INnsTgkG+2zxWGCtObzQJlVuXH2o9OvDl2l2zaK+ihYqdGQfm9Q4QJBuLccNkrSKHjBQSjNyIha9FkwwsNgnPX1B7EOs3kPx3cJuPUo02U2Fmj2jjgZFzYNLXo50Moim4/xuqX9fwgql8iDQZBCdcG6Blo5uammrpHUy4BWOvx/y/IuahTRCamAQmuYDf7ehXCxxn4918YiKuCl5di3nI+sShzhZjiSQUI0mzSRhwXY4t6FW0N6PkEV4w3Ufx7k9g/p0cRS8+310Q6L/s2rUrhDMEIQN4fwZGk+ULoE1/rPN6TeW1zb0n3H9tzs56+qfsn9CgZiwmWfW6F6KsjmpPTgtpIsvOzl4J03wfmOSKHhT73JVg2EaMJYMZvMfjmQiB2k7zoV8LriRMHITnDiRhVrKwSW/TUrR5HgxcivKturbQ/q+NDSuwkTQVjPHDVMdr71QICTti7LnwI14BDqHtBH1ojPPQ/ssYayIayBj7F2ibA5xeYKcDD+bXY940Vci2ah7fD8k5dxa6Ok+khaG9KyQwtBAwIlaYRkwmpihwbn6LKw+G5oOIfVjYmWqEcFRBwzdBaEgALDQW6otwT4wOgkB2ED+X/AH0fQp7aT32/rdZ2Osn4DD2jew7BpMAtDES/VIj8OGwtxqjPO/TLBoJG7R0OTSXmBztHAa09QPvj+gGjlcKcO4L7U/AfE7QohZC1wSLci+U4G9hNOS8WK59yAlh//9BWwcHrXsSDL4JxEiO9FugRS3Q1HXQdh8IZKF3ZFa192Dyfei3Fu8l3Otgil+DefaBiIfQbzPq3oSw7GJh4Y3U9K4jjW0AlkfzlmNtn8Qzf0pKymR46iuA9wh2aoimwEKUArcm9ZlnLHYMJ2XePmaE4vBbOL3caYYrkswbU+NEd+nxcvt2u5P98FOqrgIRPa6goKAai04BY2TNS9YaQIOT8LyI6jWPnMRffS1A+16C1z4YZvd+2jdpL0e9CX1GYT8fDY1ZDI2qgwYthKP0LuuGbBzQEKHRze28Do2PSOAR4LyYMoOEriqgWn+6KaYtDe9E1b+InQIdcMu5m3z1rYO6yhqOWDtriJLn8q/fO+v1X7PvfICeYnZoLpjk7WBOChZPGksMqgPDl+N6DHUWXKfBcbkKdabTI5SQNdAh5FoMk/0qTPdjaDsJxKOYlbxaCsmoTSaY/Q7eL4ZgPMq6fiIXCe2dQQQx1wW4LgbOJFA8cOJx/xLuP6QIAlAIXOZifYNZRCgZk9H+qtZmf6Prh7AFLgWcAJP+mvF7bjhvx5v5BaykJFTPegYUmNlzwLwR5NzgmRhZWlVVVRzV7nnsm4tgLhtBJHOMcagvj32Z8vGz6R7mPg8CcgFCnBsw5hQwXAKhFRB8CZiwDqb8aHs4sW4ArGsZCRl53BR6Yb6RsCb7o5o9jO3qceD5By1h82OdXnEcUgOSPyj5ypvzhhXufI11/UiySwDTOlG1wqE4FASZxaJSh3SPEy8LGB2LyaEoBHtySp8+feZolQh3joPxLyAJcT489IswtkBEJ+LjflHUGJH0VaDxP9T3obn6qw4oBxO/SmVypMJq90PbQ6TbgfIYQY+oxBWkXJE2a7CF9eA+DUL4I5/BdH3E/G1bCTSUQqvT+lPeGPAWzHYNtHc9YtGBTNVwtYmAMOxTEN7BvhOeU7x/MF7WNArtTBCaBBYlaKzzoESsUctra0pEDmEQqd1xmPsy1ZqF28YaiTOivpsiao58n6CEPKFSxHoQsDd/rmanFEp6gGGlYBYROuQYIrFghnn7EAyYTHtbdH/sc8nwuGehr4AME4VXZfQRAVMPSShUgqavI08ez5RZo26fRo5BGS4tQ0Y4wBv+BLcZuI4D01NZ50EC83aTP0EhH/D7d+BwNQszmtYlwRufCW98B80XCTH3aO8Ju8wZTPD/pO4wtRw5gj18MMzBvNqgle+CAZeCKPQZSj9opgOJBkqLGvCOzrMpHidv3ItrQuQAMIkH0OYeMGopNF5E4dH/TeyRThDbhT5pGNNIY5O2YsxqhEXrWIQz1traWooMGsXNJkryo90oeMx1xCiY/SchCPewTgL8gVuBw7cURYCZlNZ9LS8vbwnGOwH8zkGTbNqygI8TV4vWL6ZG+2vFL+iYgHWDqYVTpmAsZokzfsO6DzjViw7llUG4+OhpUXh4zJeBUQdRiNAyGItjWf0UPE/A/gb/yaiQAGAcB2memofWxtIhGfIkiHU/2ulpH6Y0KYibCKbnUC6anmlsOnGC1g+OmJuAaOsHA65QM130FUzIulBYBCG6iWkxLnL4av6big4a396WqoMwlQGna8g3oGfSbOAxCBbnQlyzaQzg9yTmuJ3y4PQcOguIRcSMcek7E6b2vcdX3SrD9HZ5H8f4QT5OLwQcvo2HS7ZSLrq7nDFysEaAaBVYVCOI+Truy6Lb0A+csL9A0r0g9ggwxaLlpUGEr5E+HAPNrwaRJoMw5XS0CE3ZhHKYhbVSgNZ9jrb/wHz96QgUhDOqY1DKtAYC8wQEYjby4Fomri09iqJHfTn6fIz5L0L/ZLUvCYgb872Ied2EF9oOwP0u1B2HNXmVxT4HoLH1WNN+9NmIMcdg7D50OKMe7DiB+911dXWPAd9+YHwu6PIVxtwdi/Ah01O48sLZSeNz3vCU2ZXQFyhcJxw3DuEVTukEI8+bC63Ht495sYB1X8btlHxyBJAZ9sdo25bDpyNEECMehLGreW96Z4jRry1PHoW3HmYzBUSkcM0BIXGq9RptYnk2bYc36JuOuc1gTnNE31h4nynJ1JaYoQ8TwEwrGByAUDWqOFAU4YkmRLsDDVxSPNEyLuc13qDri4wX6zDAAePIgjj9my7fPXJuSUmJhnBvfazX3jbUHdtTR8b4Mefv0JjfZ0rbpCb/9+P7Bar9ObJROaNPJcD/FNINAe+RlrKmt8tIa75P2n+G2BCt0T/6h47/lz+c+ykDlzPkttQJ95R/MObWndO1uug2rBPQI9+I/Qydh3H37diqMximpA0rmNfS6n7KfaSU9nldUtKIJKtV4BG6kd/QYbPfUQdL34E2vfYvhJ8i6Dx1/zClWpjkDe6u/2iZG1VKwfQHiqc9t88+eoltG+vkVtjRD/jFfWP7X5QUZ7o2IMkNWiV9Op/s9rW+5/a8ef23tXQue7bvx+19PaPtudFf8WiOU1REkmX+aHHWsrjUOeu8J4fRp0uhKMBtr3AG4PUEvAF3jDHa89RDUVSH/6mRHG+Ymcjr5geECDwxZDA5gV2bk7r4ipzMvU9Le8aWbAkf9rPe87B7C9rCvuHz3rqECbrZctBr0pkGfblvzcjnKEGId8rQX68bbcoaXtBw8OPPbB/ebVf7SgNmrR6YMmjcKHvZth1H3/3NiYFzVqRbCyaMth89lHx4E/um6LYdw3DYP83TJNK3ZCnDb9k2UtDrUveuGLuFqSFczuV/T83MHPhbv6u20JiQXe2uPbS67O0FlF/QdZjRPlGxm/QKCyhR/BODzOYQJSPHFz2Yel5lCSulLw9/Kl+pdBakX/7V97kcME4xJoHroIKnUZ43cw17ZP8rj4yv+p8HjiT3n/xq8oDcIcxjv9IW/hAxBKkDxj+UNmTEXE7SLcM553/EZ5x/WfrgojWcnLYD2ZsJ2UXn7vHaeV3AWW9Hkm5wZuGEvSZk2VsKpsVVVm7xFS0qvTRn3KS3gj7Gx6UgMEeUzp076fdJQybds2Pp0Ce7ZV9Fkk0IIpfb4nDlHJw46HF2djJZGXHzZ3MVyTiltab2wJd/vTt3/8qFfXxN9e9zArMO/OWi66iR6HbVERMCPvspf+kVPY46P8xy0N0U+gRI8Ta20LPoc9TRs+OYbZGn6chawZhgZYKh2mWruMN1onYxmOwvWvivYVmjJ70jepjcuL/0qh1PzU23bd9cLEnMGZ89ZOmU2+ou7Pif7Ljvd+eh57qWoKwMsSZej/t7ubPPdLNEa16Oz+EHH4yOlMZg0+HDq/3Htq+embtgtdW25ibVTHcyYlXCHb78r4I1aWNv/Ne4hWuu9Xt9lV88XLhSa2IeMWFVEMLTeOj9S/Y+P5M+GuRrd60rDXpfKMo69/pjLCfxiQ4zOp7T89IZfCxYKg7OWsqFaWkJLMantT91qN62dmXRrQ/+wVHBTy64Y4Wvr7i03F5Ttjmw64ulZ+yscGdUDIM+IVWitIkUcs7CMGaM3hJUhrlbHVJC6rBXZyxxGekQnBcEzu9o9rFWkekULrXDjK7wNrvGJGewFjHQbhsp9FcQ3p+Y3BRgTexsA75yS4nf3MCyTRdc8nhaUtEspjMVWtNHFpquLborbuyMibuWFW6HTxbSUF4WTsl0Sf7WAHdGZded5lfn1ht0OEw26CUDa0pwfuJIlMwsSGYAJzdWtyh6KpwGa9/WDjN6fX3g7alZuqccoh/jcjETLfR3ghpvYM/7h09L0p8NQDQRxVF5uQefGXc37u/OHDk/vuDiPy4WvX3+MyUn/z3UpdLhEH2jEBDdckQ/Kan/uVOkwPcrtcIrAhlyhePa6GuzfekdJOob9KlCgfOTrbec2HzrKV+QZs5fG1//8HR3R50x/llb42G71/cBjl4E5fS8qyLKspSWEs9qKpsXsLMTxHG/2/unwotuPPKLZ+U3qKJ+30tul73qZUNiPJOlcCirMyUc9Tt9zDpg6nI25mYKi6SieetvNiZlTJZF7/dOYLCkB8mTV/zy6ORpdyazkpIQ/7x1DSslSWQDptxY3m/msvxwa4WbvtS9cXTx/NZpj9Yv6yijQ98kpX66/+LE5MQDyQYDDrzDBoT2AyNOQ/PTEoWKBuelE4/aKthZmlr1eRpWUPTpa/LOnvpYoKn4Udf+jHOmHxAMCnPV1txLbWoOvPVQYr4Jaq0bNWP+Ks/5y5WTOefPWSV65XJ9vIEJRiv9LZcJ+mSDDoeN+jhL21ci/XyBr3gd8wc8J+MnXr385CWDHyRas21PZz7N6zj6Z0fa4Fm/q5z6sKPyoj8zl+TnrzSYmdu2z/9cZxgSEopHvq16dlqGqTLfrMsKBjkhUa9r3OsJbP6nrfriGXtO7GbhbNvZGF4JDTtfsgtC+jMGa/88jtMVILORIfuDB+r3vH7j3v+eSp8ZGVvK328yGEdstvQdW+x12s18kLmqtrxweXPZ5lX+1pYZzmNb/9587J/l5oQ+cT6na2zzsc83OY58SkzkEErJumDhS+as4gtEj90sSCY+Pm7A2vpv33Af/WDJGuvQy5sEIbVvMBDM4mR9i6v+wOtlG0umn/h4XsP/AuvnvHFnE27sAAAAAElFTkSuQmCC";

const formatCurrencyCompact = (amount: number): string => {
  if (isNaN(amount) || amount === 0) return "₦0";
  if (Math.abs(amount) >= 1_000_000_000) {
    return `₦${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `₦${(amount / 1_000).toFixed(0)}k`;
  }
  return `₦${amount.toLocaleString()}`;
};

const formatFullCurrency = (amount: number): string => {
  if (isNaN(amount)) return "₦0";
  return `₦${Math.round(amount).toLocaleString("en-US")}`;
};

const formatTableCurrency = (amount: number): string => {
  if (isNaN(amount)) return "₦0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDateDDMMYYYY = (dateStr?: string): string => {
  if (!dateStr) return "—";
  try {
    const raw = String(dateStr).trim();
    const parts = raw.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  } catch {
    return dateStr || "—";
  }
};

export const ExecutiveProjectReportTemplate = ({
  project,
  transactions = [],
  parsedPhases = [],
  budgetAdjustments = [],
  budgetNum = 0,
  actualSpend = 0,
  committedSpend = 0,
  lineChartData = [],
  pieChartData = [],
  companyName = "",
  companyAddress = "",
  companyPhone = "",
  companyLogo = "",
  projectManagerName = "",
}: ExecutiveProjectReportTemplateProps) => {
  // Financial calculations from live project data - NO DUMMY FALLBACKS
  const fin = typeof project?.financials === "string" ? JSON.parse(project.financials) : project?.financials;
  const currentBudget = Number(fin?.budget ?? budgetNum) || 0;
  const currentCommitted = Number(fin?.committed ?? committedSpend) || 0;
  const currentActual = Number(fin?.actual ?? fin?.spent ?? actualSpend) || 0;
  const currentRemaining = Number(fin?.remaining_budget ?? (currentBudget - currentCommitted)) || (currentBudget - currentCommitted);

  // Project manager resolution
  const resolvedPM =
    projectManagerName ||
    (project as any)?.project_manager_details?.first_name
      ? `${(project as any)?.project_manager_details?.first_name} ${(project as any)?.project_manager_details?.last_name || ""}`.trim()
      : typeof (project as any)?.project_manager === "string" && (project as any)?.project_manager.toLowerCase() !== "admin"
      ? (project as any)?.project_manager
      : "";

  // Approved adjustments calculation from live backend adjustments
  const approvedAdjList = Array.isArray(budgetAdjustments)
    ? budgetAdjustments.filter((a: any) => (a.status || "").toUpperCase() === "APPROVED")
    : [];

  const totalAdjustments = approvedAdjList.reduce((acc, curr) => {
    const val = Number(curr.amount || curr.adjustment_amount || 0);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const originalBudgetNum = Number(fin?.original_budget) || (currentBudget - totalAdjustments > 0 ? currentBudget - totalAdjustments : currentBudget);

  // Dates
  const startDateStr = formatDateDDMMYYYY(project?.start_date);
  const expectedEndDateStr = formatDateDDMMYYYY(project?.expected_end_date);
  const periodStartStr = formatDateDDMMYYYY(project?.start_date);
  const periodEndStr = formatDateDDMMYYYY(project?.expected_end_date);

  // Status label
  const rawStatus = (project?.status || "ACTIVE").toUpperCase();
  const statusLabel =
    rawStatus === "ACTIVE" || rawStatus === "IN_PROGRESS" || rawStatus === "IN PROGRESS" 
      ? "In progress" 
      : rawStatus === "DRAFT" 
      ? "Draft" 
      : rawStatus === "PENDING_APPROVAL" || rawStatus === "AWAITING APPROVAL"
      ? "Awaiting approval"
      : rawStatus === "COMPLETED"
      ? "Completed"
      : rawStatus;

  // Real Line Chart Data from dynamic timeline passed from page
  const effectiveLineData = React.useMemo(() => {
    if (Array.isArray(lineChartData) && lineChartData.length > 0) {
      const nowRef = new Date();
      const currentKey = nowRef.getFullYear() * 12 + nowRef.getMonth();

      return lineChartData.map((item: any) => {
        // Enforce available date cutoff: past the current month or explicit null from page.tsx
        let isPastAvailableDate = item.actual === null || item.actual === undefined;
        if (!isPastAvailableDate && item.date) {
          const d = new Date(item.date);
          if (!isNaN(d.getTime())) {
            const key = d.getFullYear() * 12 + d.getMonth();
            if (key > currentKey) {
              isPastAvailableDate = true;
            }
          }
        }

        const budgetVal = item.planned !== null && item.planned !== undefined 
          ? Number(item.planned) 
          : item.budget !== null && item.budget !== undefined 
          ? Number(item.budget) 
          : currentBudget || 0;

        const committedVal = !isPastAvailableDate && item.committed !== null && item.committed !== undefined
          ? Number(item.committed)
          : null;

        const actualVal = !isPastAvailableDate && item.actual !== null && item.actual !== undefined
          ? Number(item.actual)
          : null;

        return {
          name: item.name || item.short || "Period",
          budget: budgetVal,
          committed: committedVal,
          actual: actualVal,
        };
      });
    }

    if (Array.isArray(parsedPhases) && parsedPhases.length > 0) {
      return parsedPhases.map((p: any, idx: number) => {
        const pBudget = Number(p.budget || p.current_budget || 0);
        const pActs = Array.isArray(p.activities) ? p.activities : [];
        const pCommitted = pActs.reduce((acc: number, a: any) => acc + (Number(a.committed || 0) || 0), 0);
        const pActual = pActs.reduce((acc: number, a: any) => acc + (Number(a.actual || a.spent || 0) || 0), 0);
        return {
          name: p.name ? (p.name.length > 10 ? p.name.substring(0, 10) : p.name) : `Phase ${idx + 1}`,
          budget: pBudget,
          committed: pCommitted > 0 ? pCommitted : null,
          actual: pActual > 0 ? pActual : null,
        };
      });
    }

    return [];
  }, [lineChartData, parsedPhases, currentBudget]);

  // Compute dynamic max value for Line Chart Y-axis so all project scales fit perfectly
  const maxChartVal = React.useMemo(() => {
    let max = currentBudget || 100000;
    effectiveLineData.forEach((d: any) => {
      max = Math.max(
        max, 
        d.budget || 0, 
        d.committed !== null && d.committed !== undefined ? Number(d.committed) : 0, 
        d.actual !== null && d.actual !== undefined ? Number(d.actual) : 0
      );
    });
    return Math.ceil(max * 1.15);
  }, [effectiveLineData, currentBudget]);

  // Donut Chart Data: Category Spend from live project breakdown
  const DONUT_COLORS = ["#2563EB", "#EAB308", "#10B981", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#64748B"];

  const effectivePieData = React.useMemo(() => {
    if (Array.isArray(pieChartData) && pieChartData.length > 0) {
      const filtered = pieChartData.filter((item) => {
        const lower = (item.name || "").toLowerCase();
        return !lower.includes("material_consumption") && Number(item.amount || item.value || 0) > 0;
      });
      if (filtered.length > 0) {
        const total = filtered.reduce((acc, it) => acc + Number(it.amount || it.value || 0), 0);
        return filtered.map((item, idx) => {
          const val = Number(item.amount || item.value || 0);
          const pct = item.percentage !== undefined ? Math.round(Number(item.percentage)) : total > 0 ? Math.round((val / total) * 100) : 0;
          return {
            name: item.name || `Category ${idx + 1}`,
            value: val,
            percentage: pct,
            color: item.color || DONUT_COLORS[idx % DONUT_COLORS.length],
          };
        });
      }
    }
    return [];
  }, [pieChartData]);

  const totalSpentCategory = effectivePieData.reduce((acc, curr) => acc + curr.value, 0) || currentActual;
  const displayDonutSpent = formatCurrencyCompact(totalSpentCategory);

  // Revisions table items from live project data
  const revisionsList = React.useMemo(() => {
    if (Array.isArray(approvedAdjList) && approvedAdjList.length > 0) {
      return approvedAdjList.map((adj: any) => ({
        date: formatDateDDMMYYYY(adj.created_at || adj.date || adj.approved_at),
        amount: formatTableCurrency(Number(adj.amount || adj.adjustment_amount || 0)),
        reason: adj.reason || adj.justification || adj.description || "Budget adjustment",
        status: adj.status ? (adj.status.charAt(0).toUpperCase() + adj.status.slice(1).toLowerCase()) : "Approved",
      }));
    }
    return [];
  }, [approvedAdjList]);

  return (
    <div 
      className="bg-white text-gray-900 font-sans p-10 flex flex-col justify-between"
      style={{
        width: "820px",
        minHeight: "1140px",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <div>
        {/* ================= HEADER ================= */}
        <div className="flex items-start justify-between">
          {/* Logo Container */}
          <div>
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt={companyName || "Logo"} 
                className="h-10 w-auto object-contain" 
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : companyName ? (
              <div className="h-10 px-3 bg-gray-900 text-white rounded-md flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
                {companyName}
              </div>
            ) : (
              <div className="h-10 px-3 bg-gray-100 border border-gray-200 text-gray-700 rounded-md flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
                FastraSuite
              </div>
            )}
          </div>

          {/* Company Details */}
          <div className="text-right">
            {companyName && (
              <h2 className="text-[17px] font-extrabold text-gray-900 tracking-tight leading-tight">
                {companyName}
              </h2>
            )}
            {companyAddress && (
              <p className="text-[11.5px] text-gray-500 mt-0.5 leading-snug">
                {companyAddress}
              </p>
            )}
            {companyPhone && (
              <p className="text-[11.5px] text-gray-500 mt-0.5 leading-snug">
                Contact: {companyPhone}
              </p>
            )}
          </div>
        </div>

        {/* Title & Period (Guaranteed NO wrapping) */}
        <div className="mt-5">
          <h1 className="text-[26px] font-extrabold text-gray-900 tracking-tight leading-none whitespace-nowrap">
            Project Costing Report
          </h1>
          <div className="flex items-center text-[12.5px] mt-2 text-gray-800 whitespace-nowrap overflow-hidden">
            <span className="font-bold text-gray-900 shrink-0">Project:</span>
            <span className="ml-1 mr-4 font-normal text-gray-800 truncate">
              {project?.name || "Project"}
            </span>
            {(periodStartStr !== "—" || periodEndStr !== "—") && (
              <>
                <span className="font-bold text-gray-900 shrink-0">Period:</span>
                <span className="ml-1 font-normal text-gray-800 shrink-0">
                  {periodStartStr !== "—" && periodEndStr !== "—" 
                    ? `${periodStartStr} — ${periodEndStr}` 
                    : (periodStartStr !== "—" ? periodStartStr : periodEndStr)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Solid Blue Horizontal Divider */}
        <div className="w-full h-[2.5px] bg-[#1E3A8A] mt-2.5 mb-5" />

        {/* ================= 4-COLUMN METADATA ================= */}
        <div className="grid grid-cols-4 gap-0 py-1">
          {/* Col 1 */}
          <div className="pr-4 border-r border-gray-200">
            <div>
              <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
                CLIENT
              </div>
              <div className="text-[12.5px] font-bold text-gray-900 mt-0.5 truncate">
                {project?.client_name || (project as any)?.client || "—"}
              </div>
            </div>
            <div className="mt-3.5">
              <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
                START DATE
              </div>
              <div className="text-[12.5px] font-bold text-gray-900 mt-0.5">
                {startDateStr}
              </div>
            </div>
          </div>

          {/* Col 2 */}
          <div className="px-4 border-r border-gray-200">
            <div>
              <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
                PROJECT TYPE
              </div>
              <div className="text-[12.5px] font-bold text-gray-900 mt-0.5 truncate">
                {project?.project_type || (project as any)?.type || "—"}
              </div>
            </div>
            <div className="mt-3.5">
              <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
                EXPECTED END DATE
              </div>
              <div className="text-[12.5px] font-bold text-gray-900 mt-0.5">
                {expectedEndDateStr}
              </div>
            </div>
          </div>

          {/* Col 3 */}
          <div className="px-4 border-r border-gray-200">
            <div>
              <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
                PROJECT MANAGER
              </div>
              <div className="text-[12.5px] font-bold text-gray-900 mt-0.5 truncate">
                {resolvedPM && resolvedPM.toLowerCase() !== "unassigned" ? resolvedPM : "—"}
              </div>
            </div>
            <div className="mt-3.5">
              <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
                ORIGINAL BUDGET
              </div>
              <div className="text-[12.5px] font-bold text-gray-900 mt-0.5">
                {formatFullCurrency(originalBudgetNum)}
              </div>
            </div>
          </div>

          {/* Col 4 */}
          <div className="pl-4">
            <div>
              <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
                STATUS
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                <span>{statusLabel}</span>
              </div>
            </div>
            <div className="mt-3.5">
              <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
                APPROVED ADJUSTMENTS
              </div>
              <div className="text-[12.5px] font-bold text-gray-900 mt-0.5">
                {totalAdjustments !== 0 
                  ? `${totalAdjustments > 0 ? "+ " : "- "}${formatFullCurrency(Math.abs(totalAdjustments))}`
                  : "₦0"}
              </div>
            </div>
          </div>
        </div>

        {/* ================= 4 KPI CARDS ================= */}
        <div className="grid grid-cols-4 gap-3 my-5">
          <div className="border border-gray-300 rounded-lg p-3.5 bg-white">
            <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
              CURRENT BUDGET
            </div>
            <div className="text-[18px] font-extrabold text-gray-900 mt-1.5 tracking-tight">
              {formatFullCurrency(currentBudget)}
            </div>
          </div>
          <div className="border border-gray-300 rounded-lg p-3.5 bg-white">
            <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
              COMMITTED
            </div>
            <div className="text-[18px] font-extrabold text-gray-900 mt-1.5 tracking-tight">
              {formatFullCurrency(currentCommitted)}
            </div>
          </div>
          <div className="border border-gray-300 rounded-lg p-3.5 bg-white">
            <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
              ACTUAL SPEND
            </div>
            <div className="text-[18px] font-extrabold text-gray-900 mt-1.5 tracking-tight">
              {formatFullCurrency(currentActual)}
            </div>
          </div>
          <div className="border border-gray-300 rounded-lg p-3.5 bg-white">
            <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
              REMAINING
            </div>
            <div className="text-[18px] font-extrabold text-gray-900 mt-1.5 tracking-tight">
              {formatFullCurrency(currentRemaining)}
            </div>
          </div>
        </div>

        {/* ================= TWO CHARTS ================= */}
        <div className="grid grid-cols-2 gap-6 my-5">
          {/* Left Chart: Budget vs Spent by Projects (Unwrapped Title) */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2 gap-2">
              <h3 className="text-[12px] font-bold text-gray-900 whitespace-nowrap shrink-0">
                Budget vs Spent by Projects
              </h3>
              <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-medium shrink-0 whitespace-nowrap">
                <span className="flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0"></span>
                  Budget
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0"></span>
                  Committed
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0"></span>
                  Actual
                </span>
              </div>
            </div>

            <div className="w-[358px] h-[185px] flex items-center justify-center">
              {effectiveLineData && effectiveLineData.length > 0 ? (
                <LineChart width={358} height={185} data={effectiveLineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 8.5, fill: "#6B7280" }} 
                    axisLine={{ stroke: "#E5E7EB" }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, maxChartVal]}
                    tick={{ fontSize: 8.5, fill: "#9CA3AF" }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => formatCurrencyCompact(val)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="budget" 
                    stroke="#2563EB" 
                    strokeWidth={2.5} 
                    dot={false}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="committed" 
                    stroke="#10B981" 
                    strokeWidth={2.5} 
                    dot={{ r: 2.5, fill: "#10B981", strokeWidth: 0 }}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#F59E0B" 
                    strokeWidth={2.5} 
                    dot={{ r: 2.5, fill: "#F59E0B", strokeWidth: 0 }}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                </LineChart>
              ) : (
                <div className="text-center text-xs text-gray-400 py-10 w-full">
                  No spend trend data available for this project
                </div>
              )}
            </div>
          </div>

          {/* Right Chart: Spend by category (Unwrapped Title) */}
          <div className="flex flex-col items-center">
            <h3 className="text-[12px] font-bold text-gray-900 mb-1 w-full text-center whitespace-nowrap">
              Spend by category
            </h3>

            {effectivePieData && effectivePieData.length > 0 ? (
              <>
                <div className="relative w-[140px] h-[130px] flex items-center justify-center">
                  <PieChart width={140} height={130}>
                    <Pie
                      data={effectivePieData}
                      cx={70}
                      cy={65}
                      innerRadius={38}
                      outerRadius={58}
                      paddingAngle={effectivePieData.length > 1 ? 1 : 0}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {effectivePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>

                  {/* Donut Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[8px] font-semibold text-gray-400 uppercase tracking-widest leading-none">
                      SPENT
                    </span>
                    <span className="text-[12.5px] font-extrabold text-gray-900 leading-tight mt-0.5">
                      {displayDonutSpent}
                    </span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2 text-[9px] text-gray-500 font-medium max-w-[340px]">
                  {effectivePieData.map((cat, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      <span 
                        className="w-2 h-2 rounded-[1.5px] inline-block shrink-0" 
                        style={{ backgroundColor: cat.color }}
                      ></span>
                      <span className="truncate max-w-[100px]">{cat.name}</span> ({cat.percentage}%)
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-[140px] h-[130px] flex flex-col items-center justify-center text-xs text-gray-400">
                No category spend recorded
              </div>
            )}
          </div>
        </div>

        {/* ================= BUDGET REVISIONS TABLE ================= */}
        <div className="mt-4">
          <h3 className="text-[13px] font-bold text-gray-900 mb-2 whitespace-nowrap">
            Budget revisions
          </h3>
          <table className="w-full text-left">
            <thead>
              <tr className="border-t border-b border-gray-200 text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-2 font-bold w-1/4">REVISION DATE</th>
                <th className="py-2 font-bold w-1/4">AMOUNT</th>
                <th className="py-2 font-bold w-1/3">REASON</th>
                <th className="py-2 font-bold text-right">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {revisionsList.length > 0 ? (
                revisionsList.map((rev, idx) => (
                  <tr key={idx} className="border-b border-gray-100 text-gray-800 text-[11px]">
                    <td className="py-2.5 text-gray-700">{rev.date}</td>
                    <td className="py-2.5 font-bold text-gray-900">{rev.amount}</td>
                    <td className="py-2.5 text-gray-700">{rev.reason}</td>
                    <td className="py-2.5 text-right">
                      <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                        rev.status.toLowerCase().includes("approv")
                          ? "bg-[#DCFCE7] text-[#16A34A]"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {rev.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-400 text-xs">
                    No budget revisions recorded for this project
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="border-t border-gray-200 pt-3 mt-6 flex items-center justify-between text-[9px] text-gray-400">
        {/* Fastra Suite Official Brand Mark (Base64 embedded for 100% reliable export) */}
        <div className="flex items-center">
          <img
            src={FASTRASUITE_LOGO_BASE64}
            alt="FastraSuite"
            className="h-6 w-auto object-contain"
          />
        </div>

        {/* Center Tagline */}
        <div className="font-medium tracking-wider uppercase text-[8.5px] text-gray-400">
          GENERATED VIA FASTRASUITE—NIGERIA&apos;S TRUSTED PROJECT COSTING PLATFORM.
        </div>

        {/* Page Count */}
        <div className="font-medium text-[8.5px] text-gray-400">
          Page 1 of 1
        </div>
      </div>
    </div>
  );
};
