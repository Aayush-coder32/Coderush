/** BBD group colleges + branches + section batches for attendance metadata. */

const COLLEGES = ['BBDU', 'BBDITM', 'BBDNIIT'];

const BRANCHES = ['CSE', 'CSE-AI/ML', 'Civil', 'Mechanical', 'Electronics'];

/** Section codes shown per branch (CSE-style batches per user request). */
const SECTIONS_BY_BRANCH = {
  CSE: ['CSE-21', 'CSE-22', 'CSE-23', 'CSE-24'],
  'CSE-AI/ML': ['CSE-21', 'CSE-22', 'CSE-23', 'CSE-24'],
  Civil: ['CIV-21', 'CIV-22', 'CIV-23', 'CIV-24'],
  Mechanical: ['ME-21', 'ME-22', 'ME-23', 'ME-24'],
  Electronics: ['ECE-21', 'ECE-22', 'ECE-23', 'ECE-24'],
};

function isValidCohort(college, branch, section) {
  if (!COLLEGES.includes(college)) return false;
  if (!BRANCHES.includes(branch)) return false;
  const allowed = SECTIONS_BY_BRANCH[branch];
  return Boolean(allowed && allowed.includes(String(section).trim()));
}

module.exports = { COLLEGES, BRANCHES, SECTIONS_BY_BRANCH, isValidCohort };
