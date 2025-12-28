// src/app/profile/setup/SetupForm.tsx
import { saveProfileSetup } from "./actions";

function inputClass() {
  return "w-full rounded-lg bg-black/60 border border-white/10 px-3 py-2 text-white placeholder:text-white/30";
}
function labelClass() {
  return "block text-white/70 text-xs mb-1";
}

export default function SetupForm() {
  return (
    <form action={saveProfileSetup} className="space-y-5">
      {/* Birth date */}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={labelClass()}>Birth year</label>
          <input name="birthYear" required inputMode="numeric" className={inputClass()} placeholder="1990" />
        </div>
        <div>
          <label className={labelClass()}>Birth month</label>
          <input name="birthMonth" required inputMode="numeric" className={inputClass()} placeholder="1" />
        </div>
        <div>
          <label className={labelClass()}>Birth day</label>
          <input name="birthDay" required inputMode="numeric" className={inputClass()} placeholder="24" />
        </div>
      </div>

      {/* Birth time */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClass()}>Birth hour (0–23)</label>
          <input name="birthHour" required inputMode="numeric" className={inputClass()} placeholder="1" />
        </div>
        <div>
          <label className={labelClass()}>Birth minute (0–59)</label>
          <input name="birthMinute" required inputMode="numeric" className={inputClass()} placeholder="39" />
        </div>
      </div>

      {/* Location (City/State only) */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClass()}>City</label>
          <input name="city" required className={inputClass()} placeholder="Danville" />
        </div>
        <div>
          <label className={labelClass()}>State</label>
          <input name="state" required className={inputClass()} placeholder="VA" />
        </div>
      </div>

      {/* Optional label override */}
      <div>
        <label className={labelClass()}>Birth place label (optional)</label>
        <input
          name="birthPlace"
          className={inputClass()}
          placeholder='Optional display label (otherwise we’ll use the geocoder result)'
        />
        <div className="mt-2 text-xs text-neutral-400">
          We’ll automatically resolve your coordinates from City + State.
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label className={labelClass()}>Timezone</label>
        <input
          name="timezone"
          className={inputClass()}
          defaultValue="America/New_York"
          placeholder="America/New_York"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl border border-white/10 bg-white text-black py-2 font-medium hover:opacity-90"
      >
        Save profile
      </button>
    </form>
  );
}
