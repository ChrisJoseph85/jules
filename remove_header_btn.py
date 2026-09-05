import re
with open("components/MainView.tsx", "r") as f:
    code = f.read()

# Remove the old Approve Plan button from the main header since it's now in the chat box
old_approve_btn = """        {sessionData?.state === 'AWAITING_PLAN_APPROVAL' && (
          <button
            onClick={handleApprovePlan}
            className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700"
          >
            <CheckCircle2 size={18} /> Approve Plan
          </button>
        )}"""

code = code.replace(old_approve_btn, "")
with open("components/MainView.tsx", "w") as f:
    f.write(code)
