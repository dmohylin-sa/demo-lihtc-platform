// Ant Design theme - structural tokens from the antd-modern-style-demo house style,
// recoloured to Everstead's identity as used in the RFP and the bidder review pack:
// plum #521B3A, ink #2B2026, warm off-white #FDFAF7, beige panels #F5EFEA, gold #F2E286.
import type { ThemeConfig } from 'antd';

export const BRAND = {
  plum: '#521B3A',
  plumHover: '#6B2A4E',
  plumDeep: '#3F1229',
  ink: '#2B2026',
  body: '#4A3F44',
  muted: '#857A7E',
  secondary: '#6F6368',
  border: '#E4DCD8',
  borderSoft: '#ECE3DF',
  page: '#FDFAF7',
  panel: '#F5EFEA',
  panelSoft: '#FCF8F4',
  gold: '#F2E286',
  goldFill: '#FBF3C9',
  plumTint: '#F3E9EE',
  plumTint2: '#EADDE3',
  plumTint3: '#CDB9C3',
};

export const FONT_BODY = '"Instrument Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const FONT_HEAD = '"Archivo", "Instrument Sans", "Helvetica Neue", Arial, sans-serif';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: BRAND.plum,
    colorInfo: BRAND.plum,
    // Explicit info tints: AntD's derived ones from plum come out a muddy grey.
    colorInfoBg: BRAND.plumTint,
    colorInfoBgHover: BRAND.plumTint2,
    colorInfoBorder: BRAND.plumTint3,
    colorInfoBorderHover: '#B48AA3',
    colorInfoText: BRAND.plum,
    colorLink: BRAND.plum,
    colorLinkHover: BRAND.plumHover,
    colorText: BRAND.ink,
    colorTextHeading: BRAND.ink,
    colorTextSecondary: BRAND.secondary,
    colorTextTertiary: BRAND.muted,
    colorBorder: BRAND.border,
    colorBorderSecondary: BRAND.borderSoft,
    colorBgLayout: BRAND.page,
    colorFillAlter: BRAND.panelSoft,
    // --- shape ---
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 7,
    // --- sizing ---
    controlHeight: 38,
    // --- type ---
    fontSize: 14,
    fontFamily: FONT_BODY,
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: BRAND.plum,
      headerHeight: 60,
      headerPadding: '0 20px',
      bodyBg: BRAND.page,
      siderBg: '#FFFFFF',
      footerBg: BRAND.page,
    },
    Menu: {
      itemBorderRadius: 10,
      itemHeight: 40,
      itemMarginInline: 10,
      itemMarginBlock: 3,
      iconSize: 16,
      itemSelectedBg: BRAND.plumTint,
      itemSelectedColor: BRAND.plum,
      itemHoverBg: BRAND.panelSoft,
      groupTitleColor: BRAND.muted,
    },
    Card: {
      borderRadiusLG: 14,
      paddingLG: 22,
      headerFontSize: 15,
      headerHeight: 52,
    },
    Button: {
      borderRadius: 10,
      controlHeight: 38,
      fontWeight: 600,
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Table: {
      headerBg: BRAND.panel,
      headerColor: BRAND.secondary,
      borderColor: BRAND.borderSoft,
      cellPaddingBlock: 13,
      headerSplitColor: 'transparent',
      rowHoverBg: BRAND.panelSoft,
      rowSelectedBg: BRAND.plumTint,
      rowSelectedHoverBg: BRAND.plumTint2,
    },
    Tabs: { itemSelectedColor: BRAND.plum, inkBarColor: BRAND.plum, itemHoverColor: BRAND.plumHover },
    Statistic: { contentFontSize: 28 },
    Input: { borderRadius: 10, controlHeight: 38 },
    Select: { borderRadius: 10, controlHeight: 38 },
    Segmented: { borderRadius: 10, itemSelectedColor: BRAND.plum },
    Tour: { primaryPrevBtnBg: 'rgba(255,255,255,0.15)' },
    Progress: { defaultColor: BRAND.plum },
    Tree: { nodeSelectedBg: BRAND.plumTint, nodeHoverBg: BRAND.panelSoft },
  },
};
