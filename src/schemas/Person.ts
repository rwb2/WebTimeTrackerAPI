import * as mongoose from "mongoose";
import {Types} from "mongoose";
import {instanceMethod, InstanceType, pre, prop, Typegoose} from "typegoose";
import TimeEntrySchema, {TimeEntryModel} from "./TimeEntry";

@pre<PersonSchema>("save", async function (next) {
    if (this._id === undefined || this._id === null) {
        this._id = Types.ObjectId();
    }
    next();
})

export default class PersonSchema extends Typegoose {
    /* tslint:disable:variable-name */
    @prop() public _id?: Types.ObjectId;
    @prop() public firstName: string;
    @prop() public lastName: string;

    @instanceMethod
    public async getTimeEntries(): Promise<Array<InstanceType<TimeEntrySchema>>> {  // ok ok.
        // this is an array of the instance types of a
        // TimeEntryScheme wrapped in a promise
        return await TimeEntryModel.find({
            _person: this._id
        })
    }

    @instanceMethod
    public async getActiveTimeEntry(): Promise<InstanceType<TimeEntrySchema>> {
        return await TimeEntryModel.findOne({
            timeEnded: undefined,
            _person: this._id
        });
    }

    @instanceMethod
    public async signIn(): Promise<void> {
        console.log("active time entries: " + JSON.stringify(await this.getActiveTimeEntry()));
        if (await this.getActiveTimeEntry() !== null) throw new Error("User has an active time entry");
        const newEntry = new TimeEntryModel({
            timeStarted: new Date(),
            _person: this._id
        });
        await newEntry.save();
    }

    @instanceMethod
    public async signOut(): Promise<void> {
        const activeEntry = await this.getActiveTimeEntry();
        if (!activeEntry) throw new Error("User does not have an active time entry");

        activeEntry.timeEnded = new Date();
        await activeEntry.save();
    }

    @instanceMethod
    public async getExpiredTimeEntries(): Promise<Array<InstanceType<TimeEntrySchema>>> {
        return await TimeEntryModel.find({
            _person: this._id,
            timedOut: true
        });
    }
}

export const PersonModel = new PersonSchema().getModelForClass(PersonSchema, {
    existingMongoose: mongoose,
    schemaOptions: {collection: "people"}
});