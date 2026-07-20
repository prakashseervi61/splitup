import Link from "next/link";

interface GroupCardProps {
  id: string;
  name: string;
  type: "pg" | "hostel" | "trip";
  memberCount: number;
}

const typeConfig = {
  pg: { label: "PG", color: "bg-primary-subtle text-primary" },
  hostel: { label: "Hostel", color: "bg-amber-50 text-warning" },
  trip: { label: "Trip", color: "bg-green-50 text-success" },
};

export default function GroupCard({ id, name, type, memberCount }: GroupCardProps) {
  const t = typeConfig[type];

  return (
    <Link
      href={`/groups/${id}`}
      className="group block rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-primary hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-text-heading group-hover:text-primary">
            {name}
          </h3>
          <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${t.color}`}>
            {t.label}
          </span>
        </div>
      </div>

      <div className="mt-4 text-sm text-text-muted">
        {memberCount} {memberCount === 1 ? "member" : "members"}
      </div>
    </Link>
  );
}
