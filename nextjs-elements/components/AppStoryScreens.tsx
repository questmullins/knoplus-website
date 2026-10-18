import type { ReactNode } from "react";

// Drawn stand-ins for each app's screens. They tell the story; none of the apps' own code runs here.

const rose = "/apps/rosewave";

function PhoneStatus({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`phone-status ${dark ? "dark" : ""}`}>
      <span>9:41</span>
      <span>5G 84%</span>
    </div>
  );
}

/* ---------- Rosewave ---------- */

function RoseFull() {
  return (
    <div className="scr rw-full" style={{ backgroundImage: `url(${rose}/free-068.jpg)` }}>
      <PhoneStatus />
      <div className="rw-caption">
        <b>Autumnal Bubble Gum Forest</b>
        <small>01 of 12 · Free this release</small>
        <div className="rw-where">
          <span>Home</span>
          <span className="on">Lock</span>
          <span>Both</span>
        </div>
        <div className="rw-set">Set as wallpaper</div>
      </div>
    </div>
  );
}

function RoseGallery() {
  const releases = [
    ["free-068.jpg", "Autumnal Bubble Gum Forest", "12 photos"],
    ["free-013.jpg", "Cold Newport Morning", "10 photos"],
    ["free-126.jpg", "Bash Bar Night", "11 photos"],
    ["free-041.jpg", "Orange Soda Pond", "9 photos"]
  ];

  return (
    <div className="scr rw-gallery">
      <PhoneStatus />
      <p className="rw-title">Gallery</p>
      <div className="rw-chips">
        <span className="on">Releases</span>
        <span>Faves</span>
        <span>Archive</span>
      </div>
      {releases.map(([image, name, count]) => (
        <div className="rw-banner" key={name} style={{ backgroundImage: `url(${rose}/${image})` }}>
          <b>{name}</b>
          <small>{count}</small>
        </div>
      ))}
    </div>
  );
}

function RoseRelease() {
  const previews = ["084", "097", "096", "104", "098"];

  return (
    <div className="scr rw-gallery">
      <PhoneStatus />
      <p className="rw-title">Autumnal Bubble Gum Forest</p>
      <div className="rw-tiles">
        <div className="rw-tile free" style={{ backgroundImage: `url(${rose}/free-068.jpg)` }}>
          <span>Free</span>
        </div>
        {previews.map((id) => (
          <div className="rw-tile locked" key={id} style={{ backgroundImage: `url(${rose}/preview-${id}.jpg)` }}>
            <span>Members</span>
          </div>
        ))}
      </div>
      <p className="rw-note">One free photo in every release. Members unlock the rest.</p>
    </div>
  );
}

function RoseHome() {
  return (
    <div className="scr rw-home" style={{ backgroundImage: `url(${rose}/free-011.jpg)` }}>
      <PhoneStatus />
      <div className="rw-clock">
        <b>9:41</b>
        <small>Monday, October 12</small>
      </div>
      <div className="rw-apps">
        {Array.from({ length: 8 }, (_, index) => (
          <i key={index} />
        ))}
      </div>
      <div className="rw-dock">
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

function RoseRotation() {
  return (
    <div className="scr rw-sheet-screen" style={{ backgroundImage: `url(${rose}/free-013.jpg)` }}>
      <PhoneStatus />
      <div className="rw-sheet">
        <p className="rw-sheet-title">Rotation</p>
        <div className="rw-row on">
          <span>On unlock</span>
          <i />
        </div>
        <div className="rw-row">
          <span>Every 2 hours</span>
          <i />
        </div>
        <div className="rw-row">
          <span>With the sun</span>
          <small>Dawn, noon, dusk</small>
        </div>
        <p className="rw-sheet-sub">Draw from</p>
        <div className="rw-chips">
          <span className="on">Faves</span>
          <span className="on">Cold Newport Morning</span>
          <span>Everything</span>
        </div>
      </div>
    </div>
  );
}

function RosePrint() {
  return (
    <div className="scr rw-sheet-screen" style={{ backgroundImage: `url(${rose}/free-041.jpg)` }}>
      <PhoneStatus />
      <div className="rw-sheet">
        <p className="rw-sheet-title">Print this photo</p>
        <div className="rw-print">
          <div className="on">
            <i className="frame" />
            Framed
          </div>
          <div>
            <i className="metal" />
            Metal
          </div>
          <div>
            <i className="canvas" />
            Canvas
          </div>
        </div>
        <div className="rw-set">Choose a size</div>
      </div>
    </div>
  );
}

/* ---------- UpDate ---------- */

function UpTabs({ active }: { active: number }) {
  return (
    <div className="up-tabs">
      {["Home", "Dates", "People", "Settings"].map((tab, index) => (
        <span className={index === active ? "on" : ""} key={tab}>
          {tab}
        </span>
      ))}
    </div>
  );
}

function UpQuickBar() {
  return (
    <div className="up-quick">
      <span className="getout">Get Me Out</span>
      <span className="sos">Emergency</span>
    </div>
  );
}

function UpHome() {
  return (
    <div className="scr up">
      <PhoneStatus dark />
      <p className="up-hello">Good evening</p>
      <h4>Ready when you need it.</h4>
      <div className="up-action plan">
        <b>Plan a Date</b>
        <small>Share who, where and when</small>
      </div>
      <div className="up-action getout">
        <b>Get Me Out</b>
        <small>Ask a friend for an exit</small>
      </div>
      <div className="up-action sos">
        <b>Emergency</b>
        <small>One tap alerts your people</small>
      </div>
      <p className="up-label">Trusted people</p>
      <div className="up-people">
        <i>M</i>
        <i>S</i>
        <i>J</i>
      </div>
      <UpTabs active={0} />
    </div>
  );
}

function UpPlan() {
  return (
    <div className="scr up">
      <PhoneStatus dark />
      <UpQuickBar />
      <p className="up-step">Date plan · Step 3 of 7</p>
      <div className="up-progress">
        <i style={{ width: "43%" }} />
      </div>
      <h4>Where are you meeting?</h4>
      <div className="up-field">
        <small>Place</small>
        <b>Luna Café, 4th Street</b>
      </div>
      <div className="up-field">
        <small>Starts</small>
        <b>Friday · 7:30 PM</b>
      </div>
      <div className="up-field">
        <small>Getting home</small>
        <b>Rideshare, around 10:00 PM</b>
      </div>
      <div className="up-button">Next</div>
    </div>
  );
}

function UpMessage() {
  return (
    <div className="scr up">
      <PhoneStatus dark />
      <UpQuickBar />
      <p className="up-step">Preview before sending</p>
      <h4>Your date plan</h4>
      <div className="up-bubble">
        Heading out on a date tonight. Meeting Alex at Luna Café on 4th Street at 7:30 PM. Taking a rideshare home around
        10. I&apos;ll check in when I&apos;m back.
      </div>
      <p className="up-label">Sending to</p>
      <div className="up-recipients">
        <span>Maya</span>
        <span>Sam</span>
      </div>
      <div className="up-button">Send plan</div>
    </div>
  );
}

function UpGetOut() {
  return (
    <div className="scr up">
      <PhoneStatus dark />
      <p className="up-step getout-text">Get Me Out</p>
      <h4>What do you need?</h4>
      <div className="up-preset on">Call me with an excuse</div>
      <div className="up-preset">Come and pick me up</div>
      <div className="up-preset">Check on me in 20 minutes</div>
      <div className="up-toggle">
        <span>Include my location once</span>
        <i />
      </div>
      <div className="up-button getout">Send to Maya</div>
    </div>
  );
}

function UpEmergency() {
  return (
    <div className="scr up up-dark">
      <PhoneStatus />
      <div className="up-active">
        <small>Active</small>
        <b>Emergency mode</b>
        <ul>
          <li>Alert sent to 2 contacts</li>
          <li>Location shared</li>
          <li>Recording privately · 00:42</li>
        </ul>
      </div>
      <div className="up-hold">
        <i />
        Hold to end
      </div>
    </div>
  );
}

function UpWidget() {
  return (
    <div className="scr up-homescreen">
      <PhoneStatus />
      <div className="up-widget">
        <small>UpDate</small>
        <div>
          <span className="getout">Get Me Out</span>
          <span className="sos">Emergency</span>
        </div>
      </div>
      <div className="rw-apps">
        {Array.from({ length: 8 }, (_, index) => (
          <i key={index} />
        ))}
      </div>
      <div className="up-notice">
        <b>UpDate</b>
        <small>Ready when you need it</small>
      </div>
    </div>
  );
}

function UpPrivate() {
  return (
    <div className="scr up">
      <PhoneStatus dark />
      <div className="up-lock">
        <i />
        <b>UpDate is locked</b>
        <small>Emergency stays one tap away</small>
      </div>
      <ul className="up-promises">
        <li>No account</li>
        <li>No ads or tracking</li>
        <li>Encrypted on this phone</li>
        <li>Backups only to your own drive</li>
      </ul>
    </div>
  );
}

export const storyScreens: Record<string, () => ReactNode> = {
  "rose-full": RoseFull,
  "rose-gallery": RoseGallery,
  "rose-release": RoseRelease,
  "rose-home": RoseHome,
  "rose-rotation": RoseRotation,
  "rose-print": RosePrint,
  "up-home": UpHome,
  "up-plan": UpPlan,
  "up-message": UpMessage,
  "up-getout": UpGetOut,
  "up-emergency": UpEmergency,
  "up-widget": UpWidget,
  "up-private": UpPrivate
};
