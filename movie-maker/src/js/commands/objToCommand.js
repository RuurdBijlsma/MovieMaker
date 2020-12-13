import SplitFragment from "@/js/commands/SplitFragment";
import SetVolume from "@/js/commands/SetVolume";
import SetStartPoint from "@/js/commands/SetStartPoint";
import SetPlaybackRate from "@/js/commands/SetPlaybackRate";
import SetEndPoint from "@/js/commands/SetEndPoint";
import MoveFragment from "@/js/commands/MoveFragment";
import DeleteFragment from "@/js/commands/DeleteFragment";
import AddFragment from "@/js/commands/AddFragment";

export default function objToCommand(obj) {
    let f;
    switch (obj.name) {
        case "Add fragment":
            f = new AddFragment(obj.fragment);
            break;
        case "Delete fragment":
            f = new DeleteFragment(obj.fragment);
            break;
        case "Move fragment":
            f = new MoveFragment(obj.fragment, obj.newIndex);
            break;
        case "Set end point":
            f = new SetEndPoint(obj.fragment, obj.newPoint);
            break;
        case "Set playback rate":
            f = new SetPlaybackRate(obj.fragment, obj.newRate);
            break;
        case "Set start point":
            f = new SetStartPoint(obj.fragment, obj.newPoint);
            break;
        case "Set volume":
            f = new SetVolume(obj.fragment, obj.newVolume);
            break;
        case "Split fragment":
            f = new SplitFragment(obj.fragment, obj.splitPoint);
            break;
    }
    for (let key in obj) {
        if (obj.hasOwnProperty(key) && key !== 'fragment' && key !== 'name') {
            f[key] = obj[key];
        }
    }
    return f;
}