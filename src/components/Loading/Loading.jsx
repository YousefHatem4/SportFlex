import { memo } from 'react';
import { CircleLoader } from "react-spinners";

const override = {
    display: "block",
    margin: "0 auto",
    borderColor: "blue",
};

function Loading() {
    return (
        <div className="sweet-loading py-60">
            <CircleLoader
                color="#3B82F6"
                loading
                cssOverride={override}
                size={100}
                aria-label="Loading Spinner"
                data-testid="loader"
            />
        </div>
    );
}

export default memo(Loading);
