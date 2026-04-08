import {
  CommunityNoteCard,
  CommunityNotesSection,
  FeatureHighlights,
  Footer,
  HeroSection,
  Navbar,
  NewsletterSignup,
  StatsBar,
  TrendingCitiesWidget,
} from "./index";

describe("landing barrel", () => {
  it("re-exports landing components", () => {
    expect(Navbar).toBeDefined();
    expect(HeroSection).toBeDefined();
    expect(StatsBar).toBeDefined();
    expect(CommunityNoteCard).toBeDefined();
    expect(TrendingCitiesWidget).toBeDefined();
    expect(NewsletterSignup).toBeDefined();
    expect(CommunityNotesSection).toBeDefined();
    expect(FeatureHighlights).toBeDefined();
    expect(Footer).toBeDefined();
  });
});
