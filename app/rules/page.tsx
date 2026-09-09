import { getSettings } from '@/lib/data';

export default async function RulesPage() {
  const s = await getSettings();

  const rules: [string, string][] = [
    ['One team a week', 'Pick one team you think wins. Win and you move on; lose and you use a life.'],
    ['A team is single-use', `Once you pick a team you can never pick it again — win or lose. Thirty-two teams, ${s.total_weeks} weeks.`],
    ['The deadline is noon CT', "Picks close at noon Central on the day of that week's first game. Miss it and the week counts as a loss."],
    ['One buyback each', `After your first loss you can buy back in for $${s.buyback_fee}. It returns only the team you lost with — everything you've already won with stays used.`],
    ["Two losses and you're done", 'A loss after your buyback ends your season. No second buyback.'],
    ['Ties', s.tie_counts_as === 'advance' ? 'A tie advances you.' : 'A tie counts as a loss.'],
    ['The money', `$${s.entry_fee} to enter, $${s.buyback_fee} to buy back. Venmo ${s.venmo_handle}.`],
    ['The prize', s.prize_text]
  ];

  return (
    <div style={{ paddingTop: 26, maxWidth: 720 }}>
      <p className="kicker" style={{ color: 'var(--color-accent-300)', margin: 0 }}>How it works</p>
      <h1 style={{ margin: '4px 0 18px' }}>Rules</h1>
      <div className="stack" style={{ gap: 14 }}>
        {rules.map(([title, body], i) => (
          <div key={title} className="card elev-sm" style={{ gap: 6 }}>
            <span className="card-kicker">{String(i + 1).padStart(2, '0')}</span>
            <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
            <p className="card-body" style={{ margin: 0 }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
