import { useState, useMemo } from "react";
import { Controller, type Control } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

import { Check, ChevronsUpDown } from "lucide-react";

import type { FieldDef } from "@/lib/entities";
import type { EntityKey } from "@/lib/api/types";
import { useEntityAll } from "@/lib/api/hooks";

type Props = {
  field: FieldDef;
  className: string;
  control: Control<Record<string, unknown>>;
  locked: boolean;
};

export default function SearchableJobSelect({
  field,
  className,
  control,
  locked,
}: Props) {
    const [open, setOpen] = useState(false);

const src = field.optionsSource;

const { data = [] } = useEntityAll(
  (src?.entity ?? "importJobs") as EntityKey
);

type JobOption = {
  value: string;
  label: string;
  search: string;
};

const options = useMemo<JobOption[]>(() => {
  return (data as any[]).map((item) => ({
    value: String(item["jobNo"] ?? ""),
    label: `${item.jobNo ?? ""} | BL: ${item.blNo ?? "-"} | BE: ${item.beNo ?? "-"}`,
    search: [
  item["jobNo"],
  item["blNo"],
  item["beNo"],
]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  }));
}, [data]);

return (
  <Controller
    control={control}
    name={field.name}
    rules={{
      required: field.required
        ? `${field.label} is required`
        : false,
    }}
    render={({ field: ctl }) => (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={locked}
            className={className}
          >
            {ctl.value
              ? options.find((o) => o.value === ctl.value)?.label
              : "Search Job / BL / BE No"}

            <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

<PopoverContent className="w-[520px] p-0">
  <Command>
    <CommandInput placeholder="Search Job No / BL No / BE No..." />

    <CommandEmpty>No Job Found.</CommandEmpty>

    <CommandGroup>
      {options.map((option) => (
        <CommandItem
          key={option.value}
          value={option.search}
          onSelect={() => {
            ctl.onChange(option.value);
            setOpen(false);
          }}
        >
          <Check
            className={`mr-2 h-4 w-4 ${
              ctl.value === option.value ? "opacity-100" : "opacity-0"
            }`}
          />

          {option.label}
        </CommandItem>
      ))}
    </CommandGroup>
  </Command>
</PopoverContent>
      </Popover>
    )}
  />
);
}