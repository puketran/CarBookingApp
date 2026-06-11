// Single source of truth for brand theme + status colors.

export const themeConfig = {
  token: {
    colorPrimary: '#1d4ed8',
    borderRadius: 10,
    fontSize: 14,
  },
  components: {
    Layout: { headerBg: '#1e3a8a', siderBg: '#0f172a' },
    Menu: { darkItemBg: '#0f172a', darkSubMenuItemBg: '#0f172a' },
  },
};

// AntD Tag colors (badges / tables).
export const STATUS_COLOR = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  completed: 'blue',
  cancelled: 'default',
  maintenance: 'orange',
};

// Hex equivalents for borders / calendar cells.
export const STATUS_HEX = {
  pending: '#faad14',
  approved: '#52c41a',
  rejected: '#ff4d4f',
  completed: '#1677ff',
  cancelled: '#d9d9d9',
  maintenance: '#fa8c16',
};
