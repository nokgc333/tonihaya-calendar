# ドメイン層の公開関数

`src/domain/` の公開関数の一覧。UI に依存しない純粋な計算だけを置く。日付は `CivilDate`(`{ year, month, day }`、月は 1〜12)で表し、タイムゾーンの影響を受けない。

この表に載っていない公開関数があると、`tests/project/domain-api.test.ts` が失敗する。関数を足したら、ここにも書く。

## 日付(`shared/date`)

| 関数 | 内容 |
| --- | --- |
| `weekdayOf(year, month, day)` | 曜日(0 = 日曜 … 6 = 土曜) |
| `toEpochDay(year, month, day)` | 1970-01-01 を 0 とする通し日。日付の差や比較に使う |
| `fromEpochDay(epochDay)` | 通し日を日付に戻す(`toEpochDay` と往復で一致する。西暦 1〜9999 年) |
| `daysInMonth(year, month)` | その月の日数 |

## 暦(`calendar/grid`)

| 関数 | 内容 |
| --- | --- |
| `isLeapYear(year)` | 閏年か(4 で割れて 100 で割れない、または 400 で割れる) |
| `daysInMonth(year, month)` | その月の日数(閏年の 2 月は 29) |
| `getMonthGrid(year, month, weekStart)` | 月の表の 6 週 × 7 日。前後の月の日も含み、`inMonth` で区別する。`weekStart` は `"sun"` か `"mon"` |

## 祝日(`holiday/holiday`)

祝日は、現行の法律のルールを全ての年に当てはめて計算する(春分・秋分は期間ごとの近似式)。過去の年の祝日は、歴史的な実際とは異なる場合がある。

| 関数 | 内容 |
| --- | --- |
| `getHoliday(year, month, day)` | その日の祝日(なければ `null`)。振替休日・国民の休日を含む |
| `isHoliday(year, month, day)` | 祝日か |
| `getHolidaysInYear(year)` | その年の祝日を日付順に |
| `getHolidaysInMonth(year, month)` | その月の祝日を日付順に |

## 和暦(`era/era`)

| 関数 | 内容 |
| --- | --- |
| `toWareki(date)` | 元号と元号内の年(令和・平成・昭和。昭和より前は昭和として数える) |
| `formatWarekiYear(date)` | 「令和8年」「令和元年」の形 |
| `formatYearWithEra(date)` | 「2026年(令和8年)」の形 |

## カウントダウン(`countdown/countdown`)

| 関数 | 内容 |
| --- | --- |
| `getCountdowns(year, month, day)` | 次の土曜まで、月末まで、年末までの日数と、残り営業日(その日を含まない。土日と祝日を除く) |

## 時間計算(`timecalc/timecalc`)

| 関数 | 内容 |
| --- | --- |
| `addDurationToTime(time, deltaMinutes)` | 時刻に分を足し、時刻と、越えた日数(`dayOffset`)を返す(負の値も可) |
| `diffTime(start, end)` | 2 つの時刻の差(24 時間未満。終了が前なら翌日として数える) |
| `addDays(date, days)` | 日付に日数を足す(負の値も可) |
| `diffDays(from, to)` | 2 つの日付の日数の差 |
| `addDurations(a, b)` | 時間と分の長さを足す |

## 予定(`event/event`、`event/storedEvent`)

| 関数・定数 | 内容 |
| --- | --- |
| `minutesOfDay(time)` | 時刻を 0 時からの分に |
| `eventsForDay(events, date)` | その日にかかる予定(開始日から終了日まで) |
| `clipEventToDay(event, date)` | 時間指定の予定を、その日の範囲(0〜1440 分)に切り取る。日をまたぐ印つき。終日の予定は `null` |
| `layoutDayColumns(segments)` | 重なる予定を、重ならない列に割り振る(列の番号と列の数) |
| `sortForDay(events)` | 終日が先、次に開始時刻、優先度、作成順 |
| `validateEvent(draft)` | 入力された予定の誤りを、利用者に見せる文で返す(タイトル、備考、URL、日付、時刻) |
| `isSafeUrl(url)` | `http` と `https` だけを許す |
| `TITLE_MAX_LENGTH` / `NOTE_MAX_LENGTH` / `URL_MAX_LENGTH` | タイトル 200、備考 2,000、URL 2,048 文字 |
| `parseStoredEvent(value)` | 保存データの 1 件を検査する。使えなければ理由つきで拒否し、直せるもの(長すぎる文字、危険な URL)は直す |
| `isStoredCalendarEvent(value)` | 直さなくてよい、正しい予定か |

## 表示用の計算(`view/*`)

| 関数 | 内容 |
| --- | --- |
| `buildYearView(year, today, settings)` | 年表示(12 か月とカウントダウン) |
| `buildMonthView(year, month, today, weekStart)` | 月の表(日ごとの今日・祝日・土日の印、和風月名) |
| `buildMonthDetail(year, month, today, settings)` | 月の詳細(祝日の一覧、総日数、営業日、営業日残(今日を含む)) |
| `buildWeekView(reference, today, settings)` | 基準の日を含む 7 日 |
| `buildDayView(year, month, day, today)` | 1 日 |
| `minutesToOffset(minutes, hourHeightPx)` | 分を、時間軸の上の位置(px)に |
| `resolveJumpTarget(target, zoom, today)` | 表示の階層を移るときの行き先(月の日数を超える日は丸める) |
| `parseZoom(params, fallbackYear)` | URL の問い合わせから表示の状態を作る。不正な値は年の表示に落とす |
| `zoomToQuery(state)` | 表示の状態を URL の問い合わせに |
| `MIN_YEAR` / `MAX_YEAR` | 表示できる年の範囲(1950〜2150) |
| `clampYear(year)` | 年を範囲に収める |
| `resolveYearInput(raw, fallback)` | 入力欄の文字を年にする(空欄や数でない文字は元の年) |
