export function DeveloperCredit({ visible }: { visible: boolean }) {
  return (
    <p
      className={`px-4 pb-4 text-center print:hidden ${
        visible ? "text-[11px] text-muted-foreground" : "text-[10px] text-muted-foreground/70"
      }`}
    >
      Desenvolvido por <span className="font-medium text-foreground">JBDev</span>
    </p>
  );
}
