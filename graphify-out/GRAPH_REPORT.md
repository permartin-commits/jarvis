# Graph Report - C:\Prosjekter\jarvis  (2026-06-11)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 856 nodes · 1696 edges · 57 communities (44 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f5de9be3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 55|Community 55]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 165 edges
2. `query()` - 66 edges
3. `Button()` - 18 edges
4. `compilerOptions` - 16 edges
5. `Card()` - 14 edges
6. `CardContent()` - 14 edges
7. `getDb()` - 12 edges
8. `getFitnessUserId()` - 12 edges
9. `AppModal()` - 11 edges
10. `DashboardFrame()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `PATCH()` --calls--> `query()`  [INFERRED]
  src/app/api/business/leads/[id]/route.ts → src/lib/db.ts
- `Panel()` --calls--> `cn()`  [EXTRACTED]
  src/app/agent/SystemMonitor.tsx → src/lib/utils.ts
- `Metric()` --calls--> `cn()`  [EXTRACTED]
  src/app/agent/SystemMonitor.tsx → src/lib/utils.ts
- `StatCard()` --calls--> `cn()`  [EXTRACTED]
  src/app/agent/SystemMonitor.tsx → src/lib/utils.ts
- `LiveDot()` --calls--> `cn()`  [EXTRACTED]
  src/app/agent/SystemMonitor.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (57 total, 13 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (54): AiLogClient(), AiLogRow, handlingColor, AiLoggerPage(), getAiLogs(), MiniStat(), AiStats, DailyPoint (+46 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (48): BeastmakerStopwatchStartButton(), BeastmakerTimerModal(), formatDuration(), GripCm, Phase, ClimbingRouteRegisterButton(), KlatringActionPanel(), KlatringActionPanelProps (+40 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (44): parseId(), POST(), ActiveSet, EditableSet, fetchTemplateRows(), groupExercises(), replaceSets(), replaceTemplateExercises() (+36 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (31): PiaDarkModal(), PiaDarkModalProps, navItems, TopNav(), CalendarAgendaList(), formatFullRange(), formatTime(), groupByDay() (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (38): dependencies, @base-ui/react, class-variance-authority, clsx, cmdk, googleapis, leaflet, lucide-react (+30 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (24): AiMetrics, AiMetricsPanel(), DockerContainer, formatTokens(), formatUptime(), LiveDot(), logMessage(), logSource() (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (23): getMasterplan(), ProsjekterPage(), canShowStartProsjektButton(), DB_STATUSES, DEFAULT_STATUS_FILTERS, EditModal(), MappedProject, MappedStatus (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (15): EditableExercise, formatDate(), WorkoutDetailModal(), WorkoutDetailModalProps, normalizeCategory(), SET_TYPE_OPTIONS, SelectContent(), SelectGroup() (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (15): cn(), CardAction(), CardFooter(), PopoverContent(), PopoverDescription(), PopoverHeader(), PopoverTitle(), ScrollArea() (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (17): AppModal(), AppModalProps, FastOktEditor(), blankForm(), ExerciseFormState, ExerciseManager(), FitnessAdminPanel(), FitnessAdminPanelProps (+9 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (14): DagsrapportRow, Dagsrapport, formatRapportType(), DagsrapporterPanel(), DetailField(), formatDato(), typeBadgeClass(), Dialog() (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (13): GET(), GET(), POST(), query(), GET(), POST(), GET(), POST() (+5 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (15): EditableExercise, FastOktEditorProps, ActiveExercise, createSet(), LiveWorkoutLoggerProps, newClientId(), Command(), CommandDialog() (+7 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (16): activityIcon(), computeStravaSummary(), DetailModal(), DISTANCES, formatDate(), formatDuration(), formatPace(), formatTime() (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (16): getNorwegianVoice(), isNorwegianVoice(), Message, PiaOrb(), pickNorwegianVoiceFromList(), refreshNorwegianVoiceCache(), scoreNorwegianVoice(), SR (+8 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (10): CapacityBar(), EventCard(), fmtNok(), formatDate(), PameldteTable(), PAYMENT_LABEL, PAYMENT_STYLES, Props (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (10): Badge(), canonicalStatus(), INTEREST_OPTIONS, INTEREST_STYLES, STATUS_LABEL, STATUS_OPTIONS, STATUS_STYLES, StatusSelect() (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (9): CARDS, DashboardMetricsGrid(), HomeMetrics, DashboardPanel(), DigitalClock(), formatOslo(), OperationDashboard(), LINKS (+1 more)

### Community 20 - "Community 20"
Cohesion: 0.16
Nodes (9): BookingRow, BOOKING_STATUS_STYLES, BookingsTable(), fmtNok(), PAYMENT_LABEL, PAYMENT_OPTIONS, PAYMENT_STYLES, STATUS_LABEL (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.15
Nodes (9): BeastmakerLogger(), BeastmakerSession, FilterCm, GripCm, SortCol, SortDir, ClimbingRouteLog(), KlatringTab (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (5): DayRow, GET(), QdrantStatusRow, GET(), GET()

### Community 23 - "Community 23"
Cohesion: 0.24
Nodes (9): InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupText(), InputGroupTextarea() (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.29
Nodes (8): Action, BookingDbRow, buildWebhookPayload(), POST(), callConsultationWebhook(), ConsultationWebhookAction, ConsultationWebhookPayload, ConsultationWebhookResult

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (5): inter, jetbrainsMono, metadata, TooltipContent(), TooltipProvider()

### Community 26 - "Community 26"
Cohesion: 0.27
Nodes (3): DashboardFrame(), FitnessShell(), KlatringShell()

### Community 27 - "Community 27"
Cohesion: 0.29
Nodes (9): BookingHandleModal(), fmtNok(), formatDate(), PAYMENT_LABEL, Props, STATUS_LABEL, STATUS_STYLES, toDateInput() (+1 more)

### Community 28 - "Community 28"
Cohesion: 0.25
Nodes (6): BusinessShell(), Tab, TABS, EventsGrid(), LeadsTable(), HomeRightPanel()

### Community 29 - "Community 29"
Cohesion: 0.39
Nodes (3): PiaChatRightPanel(), PiaCoreSection(), FridelDashboard()

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (6): ACCENT_MAP, CardProps, fmtNok(), KpiCard(), KpiCards(), Kpis

### Community 31 - "Community 31"
Cohesion: 0.39
Nodes (6): GET(), POST(), parseRoutePayload(), DELETE(), parseId(), PATCH()

### Community 32 - "Community 32"
Cohesion: 0.32
Nodes (4): ClimbingRouteForm(), ClimbingRouteFormProps, Checkbox(), Textarea()

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (7): client, __dirname, env, line, root, sql, url

### Community 34 - "Community 34"
Cohesion: 0.25
Nodes (7): env, headers, payload, root, secretLine, url, urlLine

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (6): AiLogEntry, LogLevel, mockAiLogs, mockProjects, Project, ProjectStatus

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (4): client, __dirname, root, sql

### Community 39 - "Community 39"
Cohesion: 0.70
Nodes (4): fmtAvkastning(), fmtNok(), GET(), scalar()

### Community 40 - "Community 40"
Cohesion: 0.50
Nodes (3): LeadStatus, VALID_STATUSES, PATCH()

### Community 43 - "Community 43"
Cohesion: 0.50
Nodes (3): env, pool, url

## Knowledge Gaps
- **229 isolated node(s):** `extends`, `$schema`, `style`, `rsc`, `tsx` (+224 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 8` to `Community 0`, `Community 1`, `Community 3`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 13`, `Community 14`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 23`, `Community 25`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 32`?**
  _High betweenness centrality (0.338) - this node is a cross-community bridge._
- **Why does `query()` connect `Community 11` to `Community 0`, `Community 2`, `Community 38`, `Community 39`, `Community 6`, `Community 41`, `Community 10`, `Community 40`, `Community 45`, `Community 47`, `Community 17`, `Community 18`, `Community 20`, `Community 22`, `Community 24`, `Community 31`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `Card()` connect `Community 0` to `Community 8`, `Community 14`, `Community 6`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `query()` (e.g. with `PATCH()` and `DELETE()`) actually correct?**
  _`query()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `extends`, `$schema`, `style` to the rest of the system?**
  _229 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05322128851540616 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05407925407925408 - nodes in this community are weakly interconnected._