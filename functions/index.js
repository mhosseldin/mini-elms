const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Cloud Function to delete a user
exports.deleteUser = functions.https.onCall(async (data) => {
  const userId = data.userId;

  if (!userId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "User ID is required"
    );
  }

  try {
    // Delete the user from Authentication
    await admin.auth().deleteUser(userId);

    // Delete the user document from Firestore
    await admin.firestore().collection("users").doc(userId).delete();

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to delete the user"
    );
  }
});
