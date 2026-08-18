import * as React from "react"
import { Layout } from "@/components/layout"
import {
  useListDilutionInjectors,
  useListDilutionBrands,
  useLookupDilution,
  useReverseDilutionLookup,
} from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Droplet, RefreshCw, List, AlertTriangle, Search, FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DilutionInjector } from "@workspace/api-client-react"

type Mode = "forward" | "reverse" | "library"

export default function Dilution() {
  const [mode, setMode] = React.useState<Mode>("forward")

  return (
    <Layout>
      {/* Header */}
      <div className="bg-card border-b-2 border-border p-6">
        <h2 className="font-display text-3xl font-black uppercase tracking-tight">Dilution Expert</h2>
        <p className="text-muted-foreground font-mono text-sm mt-1">
          Forward &amp; reverse injector lookup — 65+ configurations across 8 brands.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="border-b-2 border-border bg-muted/40 flex">
        <ModeTab icon={Search} label="Forward Lookup" active={mode === "forward"} onClick={() => setMode("forward")} testId="tab-forward" />
        <ModeTab icon={RefreshCw} label="Reverse Lookup" active={mode === "reverse"} onClick={() => setMode("reverse")} testId="tab-reverse" />
        <ModeTab icon={List} label="Full Library" active={mode === "library"} onClick={() => setMode("library")} testId="tab-library" />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {mode === "forward" && <ForwardLookup />}
        {mode === "reverse" && <ReverseLookup />}
        {mode === "library" && <FullLibrary />}
      </div>
    </Layout>
  )
}

function ModeTab({
  icon: Icon,
  label,
  active,
  onClick,
  testId,
}: {
  icon: React.ElementType
  label: string
  active: boolean
  onClick: () => void
  testId: string
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "flex items-center gap-2 px-6 py-4 font-mono font-bold text-xs uppercase tracking-widest border-r-2 border-border transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Forward Lookup
// ---------------------------------------------------------------------------
const INJECTOR_COLORS = [
  "Black", "Blue", "Brown", "Clear", "Gray", "Green",
  "Orange", "Pink", "Purple", "Red", "Tan", "Teal",
  "White", "Yellow",
]

function ForwardLookup() {
  const [injectorColor, setInjectorColor] = React.useState<string>("")
  const [tipColor, setTipColor] = React.useState<string>("")
  const [brand, setBrand] = React.useState<string>("")
  const [submitted, setSubmitted] = React.useState(false)

  const { data: brands } = useListDilutionBrands()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: results, isFetching, isError } = useLookupDilution(
    { injectorColor, tipColor, brand: brand || undefined },
    { query: { enabled: submitted && !!injectorColor && !!tipColor } as any }
  )

  const handleLookup = () => setSubmitted(true)
  const handleReset = () => {
    setInjectorColor("")
    setTipColor("")
    setBrand("")
    setSubmitted(false)
  }

  // Re-submit when params change
  React.useEffect(() => {
    if (submitted) setSubmitted(false)
  }, [injectorColor, tipColor, brand])

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-card border-2 border-border p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-black text-xl uppercase">Color Match</h3>
            <p className="text-muted-foreground text-sm font-mono">Select injector body + tip color to find the ratio.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-wider">Injector Color *</Label>
            <Select value={injectorColor} onValueChange={setInjectorColor}>
              <SelectTrigger className="rounded-none border-2" data-testid="select-injector-color">
                <SelectValue placeholder="Select color…" />
              </SelectTrigger>
              <SelectContent>
                {INJECTOR_COLORS.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-wider">Tip Color *</Label>
            <Select value={tipColor} onValueChange={setTipColor}>
              <SelectTrigger className="rounded-none border-2" data-testid="select-tip-color">
                <SelectValue placeholder="Select color…" />
              </SelectTrigger>
              <SelectContent>
                {INJECTOR_COLORS.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-wider">Brand (optional)</Label>
            <Select value={brand || "__all__"} onValueChange={(v) => setBrand(v === "__all__" ? "" : v)}>
              <SelectTrigger className="rounded-none border-2" data-testid="select-brand">
                <SelectValue placeholder="Any brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Any brand</SelectItem>
                {brands?.map((b: string) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleLookup}
            disabled={!injectorColor || !tipColor}
            className="flex-1"
            data-testid="button-lookup"
          >
            <Search className="mr-2 h-4 w-4" /> Lookup
          </Button>
          <Button variant="outline" onClick={handleReset} data-testid="button-reset">
            Clear
          </Button>
        </div>
      </div>

      {/* Results */}
      {submitted && (
        <>
          {isFetching && <ResultsSkeleton />}
          {isError && <ErrorBanner />}
          {!isFetching && !isError && results && (
            results.length === 0 ? (
              <EmptyResults message="No injectors found for that color combination. Try a different pair." />
            ) : (
              <div className="space-y-4">
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                  {results.length} result{results.length !== 1 ? "s" : ""} found
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map(inj => <InjectorCard key={inj.id} injector={inj} />)}
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reverse Lookup
// ---------------------------------------------------------------------------
function ReverseLookup() {
  const [ratio, setRatio] = React.useState("")
  const [tolerance, setTolerance] = React.useState("15")
  const [brand, setBrand] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const { data: brands } = useListDilutionBrands()

  const ratioNum = parseFloat(ratio)
  const tolNum = parseFloat(tolerance)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: results, isFetching, isError } = useReverseDilutionLookup(
    { ratio: ratioNum, tolerance: tolNum || undefined, brand: brand || undefined },
    { query: { enabled: submitted && !isNaN(ratioNum) && ratioNum > 0 } as any }
  )

  const handleLookup = () => setSubmitted(true)
  const handleReset = () => {
    setRatio("")
    setTolerance("15")
    setBrand("")
    setSubmitted(false)
  }

  React.useEffect(() => {
    if (submitted) setSubmitted(false)
  }, [ratio, tolerance, brand])

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-card border-2 border-border p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-secondary text-secondary-foreground flex items-center justify-center">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-black text-xl uppercase">Target Ratio</h3>
            <p className="text-muted-foreground text-sm font-mono">Enter a target ratio to find matching injector configurations.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-wider">Target Ratio (X:1) *</Label>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 64"
              value={ratio}
              onChange={e => setRatio(e.target.value)}
              className="rounded-none border-2"
              data-testid="input-ratio"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-wider">Tolerance %</Label>
            <Input
              type="number"
              min={1}
              max={50}
              placeholder="15"
              value={tolerance}
              onChange={e => setTolerance(e.target.value)}
              className="rounded-none border-2"
              data-testid="input-tolerance"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-wider">Brand (optional)</Label>
            <Select value={brand || "__all__"} onValueChange={(v) => setBrand(v === "__all__" ? "" : v)}>
              <SelectTrigger className="rounded-none border-2" data-testid="select-brand-reverse">
                <SelectValue placeholder="Any brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Any brand</SelectItem>
                {brands?.map((b: string) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {ratio && !isNaN(ratioNum) && ratioNum > 0 && (
          <div className="bg-muted/60 border-2 border-border p-4 font-mono text-sm">
            <span className="text-muted-foreground uppercase text-xs tracking-wider">Target: </span>
            <span className="font-bold text-foreground">{ratioNum}:1</span>
            <span className="mx-3 text-border">|</span>
            <span className="text-muted-foreground uppercase text-xs tracking-wider">Oz/Gal: </span>
            <span className="font-bold text-primary">{(128 / ratioNum).toFixed(2)}</span>
            <span className="mx-3 text-border">|</span>
            <span className="text-muted-foreground uppercase text-xs tracking-wider">Range: </span>
            <span className="font-bold">
              {(ratioNum * (1 - (tolNum || 15) / 100)).toFixed(0)}–{(ratioNum * (1 + (tolNum || 15) / 100)).toFixed(0)}:1
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleLookup}
            disabled={!ratio || isNaN(ratioNum) || ratioNum <= 0}
            className="flex-1"
            data-testid="button-reverse-lookup"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Find Matches
          </Button>
          <Button variant="outline" onClick={handleReset} data-testid="button-reverse-reset">
            Clear
          </Button>
        </div>
      </div>

      {/* Results */}
      {submitted && (
        <>
          {isFetching && <ResultsSkeleton />}
          {isError && <ErrorBanner />}
          {!isFetching && !isError && results && (
            results.length === 0 ? (
              <EmptyResults message={`No injectors found within ±${tolNum || 15}% of ${ratioNum}:1. Try increasing tolerance.`} />
            ) : (
              <div className="space-y-4">
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                  {results.length} matching configuration{results.length !== 1 ? "s" : ""} — sorted closest first
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map(inj => <InjectorCard key={inj.id} injector={inj} highlight />)}
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Full Library
// ---------------------------------------------------------------------------
function FullLibrary() {
  const [search, setSearch] = React.useState("")
  const [brand, setBrand] = React.useState("")

  const { data: brands } = useListDilutionBrands()
  const { data: injectors, isLoading, isError } = useListDilutionInjectors({
    brand: brand || undefined,
  })

  const filtered = React.useMemo(() => {
    if (!injectors) return []
    const q = search.toLowerCase()
    if (!q) return injectors
    return injectors.filter(
      inj =>
        inj.brand.toLowerCase().includes(q) ||
        inj.injectorColor.toLowerCase().includes(q) ||
        inj.tipColor.toLowerCase().includes(q) ||
        inj.ratio.toString().includes(q)
    )
  }, [injectors, search])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card border-2 border-border p-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brand, color, ratio…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-none border-2"
            data-testid="input-library-search"
          />
        </div>
        <Select value={brand || "__all__"} onValueChange={(v) => setBrand(v === "__all__" ? "" : v)}>
          <SelectTrigger className="rounded-none border-2 w-full sm:w-48" data-testid="select-library-brand">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All brands</SelectItem>
            {brands?.map((b: string) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <ResultsSkeleton count={6} />}
      {isError && <ErrorBanner />}

      {!isLoading && !isError && (
        <>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            {filtered.length} injector{filtered.length !== 1 ? "s" : ""}
            {brand ? ` · ${brand}` : ""}
            {search ? ` · "${search}"` : ""}
          </p>
          {filtered.length === 0 ? (
            <EmptyResults message="No injectors match the current filters." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(inj => <InjectorCard key={inj.id} injector={inj} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------
function InjectorCard({ injector, highlight }: { injector: DilutionInjector; highlight?: boolean }) {
  return (
    <Card className={cn("rounded-none border-2", highlight && "border-primary")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-display font-black uppercase">{injector.brand}</CardTitle>
          <Badge variant="secondary" className="font-mono rounded-none text-sm font-bold">
            {injector.ratio}:1
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Color dots */}
        <div className="flex items-center gap-4">
          <ColorDot label="Body" color={injector.injectorColor} />
          <div className="h-px flex-1 border-t-2 border-dashed border-border" />
          <ColorDot label="Tip" color={injector.tipColor} />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t-2 border-border/50">
          <Metric label="Oz / Gal" value={Number(injector.ozPerGallon).toFixed(2)} accent />
          <Metric label="GPM" value={Number(injector.gpm).toFixed(1)} />
        </div>

        {injector.notes && (
          <p className="text-xs text-muted-foreground font-mono border-t-2 border-border/30 pt-2">
            {injector.notes}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ColorDot({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-4 h-4 border-2 border-border rounded-full shrink-0"
        style={{ backgroundColor: color.toLowerCase() }}
        title={color}
      />
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase">{label}</p>
        <p className="text-xs font-bold">{color}</p>
      </div>
    </div>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-muted/40 p-2">
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn("font-display font-black text-xl", accent && "text-primary")}>{value}</p>
    </div>
  )
}

function ResultsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full border-2 border-border rounded-none" />
      ))}
    </div>
  )
}

function ErrorBanner() {
  return (
    <div className="p-8 border-2 border-destructive bg-destructive/10 text-destructive flex flex-col items-center justify-center text-center">
      <AlertTriangle className="h-10 w-10 mb-3" />
      <p className="font-bold text-lg">Lookup Failed</p>
      <p className="text-sm font-mono mt-1">Could not reach the dilution database. Check your connection.</p>
    </div>
  )
}

function EmptyResults({ message }: { message: string }) {
  return (
    <div className="p-12 border-2 border-dashed border-border flex flex-col items-center justify-center text-center">
      <FlaskConical className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
      <p className="font-display font-bold text-xl uppercase">No Results</p>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">{message}</p>
    </div>
  )
}
