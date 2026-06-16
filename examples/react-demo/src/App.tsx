import { getStrengthMessage, type PasswordStrengthResult } from "@pwd-meter/core";
import { PasswordInput, PasswordStrengthMeter, usePasswordStrength } from "@pwd-meter/react";
import { useState } from "react";

function ResultPanel({ result }: { result: PasswordStrengthResult }) {
  return (
    <pre className="result-panel">{JSON.stringify(result, null, 2)}</pre>
  );
}

export default function App() {
  const [password, setPassword] = useState("");
  const [checkPwned, setCheckPwned] = useState(true);
  const hookResult = usePasswordStrength(password, { checkPwned });

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">@pwd-meter/react</p>
        <h1>Password Strength Demo</h1>
        <p className="subtitle">
          Try typing a password, generate a secure one, or test a known breached password like{" "}
          <code>password</code>.
        </p>
      </header>

      <section className="card">
        <div className="card__header">
          <h2>PasswordInput</h2>
          <label className="toggle">
            <input
              type="checkbox"
              checked={checkPwned}
              onChange={(event) => setCheckPwned(event.target.checked)}
            />
            Enable HIBP breach check
          </label>
        </div>

        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder="Create a password"
          checkPwned={checkPwned}
          showMeter
          showGenerate
        />
      </section>

      <section className="card">
        <h2>Standalone meter + hook</h2>
        <p className="hint">
          Current strength: <strong>{getStrengthMessage(hookResult)}</strong>
        </p>
        <PasswordStrengthMeter
          password={password}
          result={hookResult}
          showChecks
          showSuggestions
        />
        <ResultPanel result={hookResult} />
      </section>
    </main>
  );
}
