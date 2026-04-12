const mongoose = require('mongoose');

const libraryLoanSchema = new mongoose.Schema(
  {
    /** Optional when student logs a subject-only borrow (no catalog copy). */
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'CampusResource', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    issuedAt: { type: Date, default: Date.now },
    dueAt: { type: Date, required: true },
    returnedAt: { type: Date },
    collegeName: { type: String, default: '', trim: true },
    registrationNumber: { type: String, default: '', trim: true },
    /** Title / subject of the book borrowed. */
    subjectTitle: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

libraryLoanSchema.index({ user: 1, returnedAt: 1 });
libraryLoanSchema.index({ resource: 1, returnedAt: 1 });

module.exports = mongoose.model('LibraryLoan', libraryLoanSchema);
