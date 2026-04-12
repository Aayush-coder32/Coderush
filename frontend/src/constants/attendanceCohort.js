/** Must stay in sync with `backend/src/constants/attendanceCohort.js` */

export const COLLEGES = ['BBDU', 'BBDITM', 'BBDNIIT']

export const BRANCHES = ['CSE', 'CSE-AI/ML', 'Civil', 'Mechanical', 'Electronics']

export const SECTIONS_BY_BRANCH = {
  CSE: ['CSE-21', 'CSE-22', 'CSE-23', 'CSE-24'],
  'CSE-AI/ML': ['CSE-21', 'CSE-22', 'CSE-23', 'CSE-24'],
  Civil: ['CIV-21', 'CIV-22', 'CIV-23', 'CIV-24'],
  Mechanical: ['ME-21', 'ME-22', 'ME-23', 'ME-24'],
  Electronics: ['ECE-21', 'ECE-22', 'ECE-23', 'ECE-24'],
}
