
function getSwitchTeamsLabel() {
    switch (knlLan_lcid)
    {
        case 1031:
            return 'Teams auf der Anzeigetafel Wechseln';

        case 1043:
            return 'Verwissel teams op scorebord';

        default:
            return 'Switch teams on scoreboard';
    }
};

function getConnectionStatusLabel() {
    switch (knlLan_lcid)
    {
        case 1031:
            return 'Verbindungsstatus zur Anzeigetafel';

        case 1043:
            return 'Verbindingsstatus met scorebord';

        default:
            return 'Connection status to scoreboard';
    }
};

function getConfirmDialogText() {
    switch (knlLan_lcid)
    {
        case 1031:
            return 'Überprüfen Sie das Ergebnis vor dem Absenden mit den Mannschafts-Kapitänen!';

        case 1043:
            return 'Controleer de resultaten met de team aanvoerders, voor het indienen!';

        default:
            return 'Verify the result with the team captains, before submitting!';
    }
};
